// server/omnigrid_server.cpp
// Compile: g++ -std=c++17 -O2 -pthread server/omnigrid_server.cpp -o omnigrid_server
// With libpcap: g++ -std=c++17 -O2 -pthread -DHAVE_PCAP server/omnigrid_server.cpp -lpcap -o omnigrid_server

#include <algorithm>
#include <cctype>
#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>
#include <thread>
#include <mutex>
#include <atomic>
#include <chrono>
#include <cstring>
#include <cstdlib>
#include <csignal>
#include <filesystem>
#include <netinet/in.h>
#include <unistd.h>
#include <sys/socket.h>
#include <sys/wait.h>

#ifdef HAVE_PCAP
#include <pcap.h>
#include <netinet/ip.h>
#include <arpa/inet.h>
#endif

namespace fs = std::filesystem;

static std::atomic<bool> g_running{true};
static pid_t g_python_pid = -1;
static std::mutex g_ws_mutex;
static std::vector<int> g_pcap_clients;

namespace crypto {
    inline uint32_t rol(uint32_t value, size_t bits) { return (value << bits) | (value >> (32 - bits)); }

    std::vector<uint8_t> sha1(const std::string& input) {
        uint32_t h0 = 0x67452301, h1 = 0xEFCDAB89, h2 = 0x98BADCFE, h3 = 0x10325476, h4 = 0xC3D2E1F0;
        std::vector<uint8_t> msg(input.begin(), input.end());
        uint64_t bit_len = msg.size() * 8;
        msg.push_back(0x80);
        while ((msg.size() * 8) % 512 != 448) msg.push_back(0x00);
        for (int i = 7; i >= 0; --i) msg.push_back((bit_len >> (i * 8)) & 0xFF);

        for (size_t chunk = 0; chunk < msg.size(); chunk += 64) {
            uint32_t w[80];
            for (int i = 0; i < 16; ++i)
                w[i] = (msg[chunk + i * 4] << 24) | (msg[chunk + i * 4 + 1] << 16) |
                       (msg[chunk + i * 4 + 2] << 8) | (msg[chunk + i * 4 + 3]);
            for (int i = 16; i < 80; ++i) w[i] = rol(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);

            uint32_t a = h0, b = h1, c = h2, d = h3, e = h4;
            for (int i = 0; i < 80; ++i) {
                uint32_t f, k;
                if (i < 20) { f = (b & c) | ((~b) & d); k = 0x5A827999; }
                else if (i < 40) { f = b ^ c ^ d; k = 0x6ED9EBA1; }
                else if (i < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8F1BBCDC; }
                else { f = b ^ c ^ d; k = 0xCA62C1D6; }
                uint32_t temp = rol(a, 5) + f + e + k + w[i];
                e = d; d = c; c = rol(b, 30); b = a; a = temp;
            }
            h0 += a; h1 += b; h2 += c; h3 += d; h4 += e;
        }
        std::vector<uint8_t> digest(20);
        uint32_t hs[5] = {h0, h1, h2, h3, h4};
        for (int i = 0; i < 5; ++i) {
            digest[i * 4]     = (hs[i] >> 24) & 0xFF;
            digest[i * 4 + 1] = (hs[i] >> 16) & 0xFF;
            digest[i * 4 + 2] = (hs[i] >> 8) & 0xFF;
            digest[i * 4 + 3] = hs[i] & 0xFF;
        }
        return digest;
    }

    std::string base64_encode(const std::vector<uint8_t>& data) {
        static const char* lut = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        std::string out;
        int val = 0, valb = -6;
        for (uint8_t c : data) {
            val = (val << 8) + c;
            valb += 8;
            while (valb >= 0) { out.push_back(lut[(val >> valb) & 0x3F]); valb -= 6; }
        }
        if (valb > -6) out.push_back(lut[((val << 8) >> (valb + 8)) & 0x3F]);
        while (out.size() % 4) out.push_back('=');
        return out;
    }
}

bool ws_send_text(int client_fd, const std::string& payload) {
    std::vector<uint8_t> frame;
    frame.push_back(0x81);
    size_t len = payload.size();
    if (len <= 125) {
        frame.push_back(static_cast<uint8_t>(len));
    } else if (len <= 65535) {
        frame.push_back(126);
        frame.push_back((len >> 8) & 0xFF);
        frame.push_back(len & 0xFF);
    } else {
        return false;
    }
    frame.insert(frame.end(), payload.begin(), payload.end());
    ssize_t sent = send(client_fd, frame.data(), frame.size(), MSG_NOSIGNAL);
    return sent == static_cast<ssize_t>(frame.size());
}

void broadcast_pcap_envelope(const std::string& json_envelope) {
    std::lock_guard<std::mutex> lock(g_ws_mutex);
    for (auto it = g_pcap_clients.begin(); it != g_pcap_clients.end();) {
        if (!ws_send_text(*it, json_envelope)) {
            close(*it);
            it = g_pcap_clients.erase(it);
        } else {
            ++it;
        }
    }
}

void network_analyzer_worker() {
    uint64_t seq = 1;
#ifdef HAVE_PCAP
    char errbuf[PCAP_ERRBUF_SIZE];
    pcap_if_t *alldevs, *dev;
    if (pcap_findalldevs(&alldevs, errbuf) == 0 && alldevs != nullptr) {
        pcap_t* handle = pcap_open_live(alldevs->name, BUFSIZ, 1, 1000, errbuf);
        pcap_freealldevs(alldevs);
        if (handle) {
            std::cout << "[Network-Analyzer] Live libpcap capture online.\n";
            struct pcap_pkthdr* header;
            const u_char* packet;
            while (g_running) {
                int res = pcap_next_ex(handle, &header, &packet);
                if (res <= 0) continue;
                if (header->caplen >= 14 + sizeof(struct ip)) {
                    const struct ip* ip_hdr = reinterpret_cast<const struct ip*>(packet + 14);
                    char src_ip[INET_ADDRSTRLEN], dst_ip[INET_ADDRSTRLEN];
                    inet_ntop(AF_INET, &(ip_hdr->ip_src), src_ip, INET_ADDRSTRLEN);
                    inet_ntop(AF_INET, &(ip_hdr->ip_dst), dst_ip, INET_ADDRSTRLEN);

                    std::ostringstream oss;
                    oss << "{\"id\":\"pcap-" << seq++ << "\","
                        << "\"timestamp\":" << (header->ts.tv_sec * 1000ULL) << ","
                        << "\"sourceWidgetId\":\"cpp.sidecar.network-analyzer\","
                        << "\"targetWidgetId\":\"*\","
                        << "\"mimeType\":\"sec/pcap-packet\","
                        << "\"payload\":{\"srcIp\":\"" << src_ip << "\","
                        << "\"dstIp\":\"" << dst_ip << "\","
                        << "\"protocol\":" << static_cast<int>(ip_hdr->ip_p) << ","
                        << "\"bytes\":" << header->len << ","
                        << "\"anomalyScore\":" << ((header->len > 1400) ? 0.87 : 0.12) << "}}";
                    broadcast_pcap_envelope(oss.str());
                }
            }
            pcap_close(handle);
            return;
        }
    }
#endif
    std::cout << "[Network-Analyzer] Running unprivileged telemetry stream.\n";
    while (g_running) {
        std::this_thread::sleep_for(std::chrono::milliseconds(1500));
        auto now = std::chrono::duration_cast<std::chrono::milliseconds>(
                       std::chrono::system_clock::now().time_since_epoch())
                       .count();
        bool spike = (seq % 7 == 0);
        std::ostringstream oss;
        oss << "{\"id\":\"pcap-" << seq++ << "\","
            << "\"timestamp\":" << now << ","
            << "\"sourceWidgetId\":\"cpp.sidecar.network-analyzer\","
            << "\"targetWidgetId\":\"*\","
            << "\"mimeType\":\"sec/pcap-packet\","
            << "\"payload\":{\"srcIp\":\"" << (spike ? "185.220.101.42" : "192.168.1.104") << "\","
            << "\"dstIp\":\"10.0.0.1\","
            << "\"protocol\":\"TCP\","
            << "\"bytes\":" << (spike ? 4096 : 512) << ","
            << "\"anomalyScore\":" << (spike ? 0.94 : 0.08) << "}}";
        broadcast_pcap_envelope(oss.str());
    }
}

std::string get_mime_type(const std::string& path) {
    if (path.rfind(".html") != std::string::npos) return "text/html";
    if (path.rfind(".js") != std::string::npos) return "application/javascript";
    if (path.rfind(".css") != std::string::npos) return "text/css";
    if (path.rfind(".wasm") != std::string::npos) return "application/wasm";
    if (path.rfind(".json") != std::string::npos) return "application/json";
    if (path.rfind(".svg") != std::string::npos) return "image/svg+xml";
    return "application/octet-stream";
}

void handle_client(int client_fd, const std::string& web_root) {
    std::string req;
    char buffer[4096];
    while (req.find("\r\n\r\n") == std::string::npos && req.size() < 16384) {
        ssize_t bytes = recv(client_fd, buffer, sizeof(buffer), 0);
        if (bytes <= 0) break;
        req.append(buffer, static_cast<size_t>(bytes));
    }
    if (req.empty()) { close(client_fd); return; }
    std::istringstream iss(req);
    std::string method, url_path, protocol;
    iss >> method >> url_path >> protocol;

    std::string req_lower = req;
    std::transform(req_lower.begin(), req_lower.end(), req_lower.begin(),
                   [](unsigned char c) { return static_cast<char>(std::tolower(c)); });
    const bool ws_upgrade = req_lower.find("upgrade: websocket") != std::string::npos;
    const bool pcap_path = url_path == "/ipc/pcap-stream" || url_path.rfind("/ipc/pcap-stream?", 0) == 0;

    if (ws_upgrade && pcap_path) {
        auto key_pos = req_lower.find("sec-websocket-key:");
        if (key_pos != std::string::npos) {
            size_t start = key_pos + std::string("sec-websocket-key:").size();
            while (start < req.size() && (req[start] == ' ' || req[start] == '\t')) start++;
            size_t end = req.find("\r\n", start);
            std::string sec_key = req.substr(start, end - start);
            // trim trailing spaces
            while (!sec_key.empty() && (sec_key.back() == ' ' || sec_key.back() == '\r')) sec_key.pop_back();
            std::string accept_key = crypto::base64_encode(
                crypto::sha1(sec_key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
            );

            std::ostringstream resp;
            resp << "HTTP/1.1 101 Switching Protocols\r\n"
                 << "Upgrade: websocket\r\n"
                 << "Connection: Upgrade\r\n"
                 << "Sec-WebSocket-Accept: " << accept_key << "\r\n\r\n";
            std::string r_str = resp.str();
            send(client_fd, r_str.c_str(), r_str.size(), 0);

            std::lock_guard<std::mutex> lock(g_ws_mutex);
            g_pcap_clients.push_back(client_fd);
            return;
        }
    }

    if (url_path == "/api/sidecar/health") {
        std::string body = "{\"status\":\"ONLINE\",\"cppServer\":true,\"pythonSidecarPort\":8001}";
        std::ostringstream resp;
        resp << "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n"
             << "Access-Control-Allow-Origin: *\r\n"
             << "Content-Length: " << body.size() << "\r\n\r\n" << body;
        std::string r_str = resp.str();
        send(client_fd, r_str.c_str(), r_str.size(), 0);
        close(client_fd);
        return;
    }

    if (url_path == "/") url_path = "/index.html";
    fs::path safe_path = fs::path(web_root) / fs::path(url_path).relative_path();
    if (!fs::exists(safe_path) || fs::is_directory(safe_path)) {
        safe_path = fs::path(web_root) / "index.html";
    }

    std::ifstream file(safe_path, std::ios::binary);
    if (!file) {
        std::string not_found = "HTTP/1.1 404 Not Found\r\nContent-Length: 9\r\n\r\nNot Found";
        send(client_fd, not_found.c_str(), not_found.size(), 0);
        close(client_fd);
        return;
    }

    std::ostringstream content;
    content << file.rdbuf();
    std::string body = content.str();
    std::ostringstream resp;
    resp << "HTTP/1.1 200 OK\r\n"
         << "Content-Type: " << get_mime_type(safe_path.string()) << "\r\n"
         << "Cross-Origin-Opener-Policy: same-origin\r\n"
         << "Cross-Origin-Embedder-Policy: require-corp\r\n"
         << "Content-Length: " << body.size() << "\r\n\r\n";
    std::string header = resp.str();
    send(client_fd, header.c_str(), header.size(), 0);
    send(client_fd, body.c_str(), body.size(), 0);
    close(client_fd);
}

void spawn_python_sidecar() {
    if (!fs::exists("server/sidecar/main.py")) return;
    g_python_pid = fork();
    if (g_python_pid == 0) {
        execlp("uvicorn", "uvicorn", "server.sidecar.main:app", "--host", "127.0.0.1", "--port", "8001", nullptr);
        std::exit(1);
    }
    std::cout << "[Omni-Grid C++] Spawned Python FastAPI Sidecar (PID " << g_python_pid << ") on ws://127.0.0.1:8001\n";
}

void shutdown_handler(int) {
    g_running = false;
    if (g_python_pid > 0) kill(g_python_pid, SIGTERM);
    std::exit(0);
}

int main(int argc, char* argv[]) {
    std::signal(SIGINT, shutdown_handler);
    std::signal(SIGTERM, shutdown_handler);

    int port = (argc > 1) ? std::atoi(argv[1]) : 1234;
    std::string web_root = fs::exists("dist") ? "dist" : ".";

    spawn_python_sidecar();
    std::thread pcap_thread(network_analyzer_worker);
    pcap_thread.detach();

    int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    sockaddr_in addr{};
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons(port);

    if (bind(server_fd, reinterpret_cast<sockaddr*>(&addr), sizeof(addr)) < 0 || listen(server_fd, 64) < 0) {
        std::cerr << "[Omni-Grid C++] Failed to bind port " << port << "\n";
        return 1;
    }

    std::cout << "[Omni-Grid C++] Online at http://localhost:" << port
              << " | PCAP WS: ws://localhost:" << port << "/ipc/pcap-stream\n";

    while (g_running) {
        sockaddr_in client_addr{};
        socklen_t client_len = sizeof(client_addr);
        int client_fd = accept(server_fd, reinterpret_cast<sockaddr*>(&client_addr), &client_len);
        if (client_fd >= 0) {
            std::thread(handle_client, client_fd, web_root).detach();
        }
    }
    return 0;
}
