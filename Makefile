# Makefile
CXX = g++
CXXFLAGS = -std=c++17 -O2 -Wall -Wextra -pthread

# Uncomment to enable raw libpcap packet capture for Network-Analyzer:
# PCAP_FLAGS = -DHAVE_PCAP -lpcap

server:
	$(CXX) $(CXXFLAGS) server/omnigrid_server.cpp $(PCAP_FLAGS) -o omnigrid_server

run-superapp: server
	./omnigrid_server 1234

WASM_OUT = public/wasm/dsp4guitar_core.js

wasm-dsp:
	mkdir -p public/wasm
	emcc dsp/dsp4guitar_wasm.cpp -O3 -std=c++17 \
		-sWASM=1 -sSINGLE_FILE=1 \
		-sALLOW_MEMORY_GROWTH=0 -sINITIAL_MEMORY=16777216 \
		-sEXPORTED_FUNCTIONS='["_malloc","_free"]' \
		-sEXPORTED_RUNTIME_METHODS='["HEAPF32"]' \
		--bind -o $(WASM_OUT)

clean:
	rm -f omnigrid_server
