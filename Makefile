# Makefile
CXX = g++
CXXFLAGS = -std=c++17 -O2 -Wall -Wextra -pthread

# Uncomment to enable raw libpcap packet capture for Network-Analyzer:
# PCAP_FLAGS = -DHAVE_PCAP -lpcap

server:
	$(CXX) $(CXXFLAGS) server/omnigrid_server.cpp $(PCAP_FLAGS) -o omnigrid_server

run-superapp: server
	./omnigrid_server 1234

clean:
	rm -f omnigrid_server
