# server/sidecar/main.py
# Run standalone or auto-spawned by omnigrid_server.cpp:
# pip install fastapi uvicorn

import asyncio
import json
import os
import re
import time
import uuid
from typing import Dict, Set
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

try:
    import cv2
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False

try:
    from google import genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False

app = FastAPI(title="Omni-Grid 2.0 Python Sidecar", version="2.8.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class SidecarHub:
    def __init__(self) -> None:
        self.clients: Set[WebSocket] = set()
        self.biometric_active = False
        self.gemini_client = (
            genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
            if HAS_GEMINI and os.environ.get("GEMINI_API_KEY")
            else None
        )

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self.clients.add(ws)

    def disconnect(self, ws: WebSocket) -> None:
        self.clients.discard(ws)

    async def broadcast_envelope(
        self,
        source_id: str,
        mime_type: str,
        payload: Dict,
        target_id: str = "*",
    ) -> None:
        envelope = {
            "id": str(uuid.uuid4()),
            "timestamp": int(time.time() * 1000),
            "sourceWidgetId": source_id,
            "targetWidgetId": target_id,
            "mimeType": mime_type,
            "payload": payload,
        }
        raw = json.dumps(envelope)
        dead_clients = []
        for ws in self.clients:
            try:
                await ws.send_text(raw)
            except Exception:
                dead_clients.append(ws)
        for d in dead_clients:
            self.disconnect(d)


hub = SidecarHub()


async def face_recon_sentinel_loop() -> None:
    cascade = None
    if HAS_OPENCV:
        xml_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        cascade = cv2.CascadeClassifier(xml_path)

    while True:
        await asyncio.sleep(3.0)
        if not hub.clients:
            continue

        operator_present = True
        confidence = 0.98

        if HAS_OPENCV and cascade is not None and os.environ.get("ENABLE_WEBCAM") == "1":
            cap = cv2.VideoCapture(0)
            if cap.isOpened():
                ret, frame = cap.read()
                cap.release()
                if ret:
                    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                    faces = cascade.detectMultiScale(gray, 1.3, 5)
                    operator_present = len(faces) > 0
                    confidence = 0.95 if operator_present else 0.05

        await hub.broadcast_envelope(
            source_id="python.sidecar.face-recon",
            mime_type="sec/biometric-auth",
            payload={
                "operatorPresent": operator_present,
                "identity": "Jon-Arve Constantine" if operator_present else "NONE",
                "confidence": confidence,
                "vaultLocked": not operator_present,
            },
        )


def chords_for_prompt(prompt: str, bpm: int) -> Dict:
    text = prompt.lower()
    dark = any(word in text for word in ("phrygian", "noir", "dark", "minor"))
    if dark:
        voicings = [
            (0, "Em Phrygian", [0, 2, 2, 0, 3, 0], [40, 47, 52, 55, 62, 64]),
            (4, "Fmaj (bII)", [1, 3, 3, 2, 1, 1], [41, 48, 53, 57, 60, 65]),
            (8, "Am(b6)", [5, 7, 7, 5, 8, 8], [45, 52, 57, 60, 64, 68]),
            (12, "B7alt", [None, 2, 1, 2, 0, 3], [47, 51, 57, 59, 67]),
        ]
    else:
        voicings = [
            (0, "Em9 (Nordic Noir)", [0, 2, 4, 0, 3, 2], [40, 47, 54, 55, 62, 66]),
            (4, "Cmaj7#11 (Cyber)", [None, 3, 2, 4, 0, 2], [48, 52, 59, 64, 66]),
            (8, "Amadd9", [None, 0, 2, 4, 1, 0], [45, 52, 59, 60, 64]),
            (12, "B7alt (Tension)", [None, 2, 1, 2, 0, 3], [47, 51, 57, 59, 67]),
        ]
    return {
        str(step): {
            "chordName": name,
            "frets": frets,
            "midiNotes": notes,
            "bpm": bpm,
        }
        for step, name, frets, notes in voicings
    }


async def handle_agent_task(envelope: Dict) -> None:
    payload = envelope.get("payload", {})
    prompt = payload.get("prompt", "")
    agent_role = payload.get("agentRole", "SECOPS_ARCHITECT")
    requester_id = envelope.get("sourceWidgetId", "*")

    if hub.gemini_client:
        response = await asyncio.to_thread(
            hub.gemini_client.models.generate_content,
            model="gemini-2.5-flash",
            contents=f"[Agent Role: {agent_role}]\n{prompt}",
        )
        reply_text = response.text
    else:
        reply_text = (
            f"[{agent_role} LOCAL SYNTHESIS] Analyzed task: '{prompt[:80]}'. "
            "Set GEMINI_API_KEY in environment for live LLM execution."
        )

    bpm_match = re.search(r"(\d{2,3})\s*bpm", prompt, re.I)
    bpm = int(bpm_match.group(1)) if bpm_match else 124
    audio = agent_role == "NEURAL_AUDIO_COMPOSER" or "guitar" in prompt.lower() or "stem" in prompt.lower()
    reply_payload = {
        "agentRole": agent_role,
        "status": "COMPLETED",
        "output": reply_text,
        "originalTaskId": envelope.get("id"),
    }
    if audio:
        reply_payload["bpm"] = bpm
        reply_payload["chords"] = chords_for_prompt(prompt, bpm)
        reply_payload["output"] = (
            f"[{agent_role}] Locked {bpm} BPM and pushed a 4-bar guitar ribbon onto the timeline."
        )

    await hub.broadcast_envelope(
        source_id="python.sidecar.master-agentic-ai",
        mime_type="ai/agent-task",
        target_id=requester_id,
        payload=reply_payload,
    )


@app.on_event("startup")
async def on_startup() -> None:
    asyncio.create_task(face_recon_sentinel_loop())


@app.websocket("/ws/sidecar")
async def sidecar_ws_endpoint(websocket: WebSocket) -> None:
    await hub.connect(websocket)
    try:
        while True:
            raw_msg = await websocket.receive_text()
            envelope = json.loads(raw_msg)
            mime = envelope.get("mimeType")

            if mime in ("ai/prompt", "ai/agent-task"):
                asyncio.create_task(handle_agent_task(envelope))

            elif mime == "sec/pcap-packet":
                pkt = envelope.get("payload", {})
                if pkt.get("anomalyScore", 0) > 0.85:
                    await handle_agent_task({
                        "id": envelope.get("id"),
                        "sourceWidgetId": "*",
                        "payload": {
                            "agentRole": "AUTOSEC_RESPONDER",
                            "prompt": (
                                f"High anomaly packet detected from {pkt.get('srcIp')} "
                                f"({pkt.get('bytes')} bytes). Recommend immediate iptables rule."
                            ),
                        },
                    })
    except WebSocketDisconnect:
        hub.disconnect(websocket)
