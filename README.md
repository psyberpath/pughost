# pughost
**Production Parity for Local Development**

## Overview
Pughost is a network simulation layer that sits between your local client and your local server. It introduces deterministic network toxicity—latency, jitter, bandwidth limits, and packet loss—to replicate real-world constraints within your development environment.

It is designed to force early detection of:
- Race conditions caused by network latency.
- UI/UX failures during slow data ingestion.
- Timeout handling and retry logic.
- Bandwidth-constrained performance issues.

## Architecture
Pughost operates as a process-managed wrapper around **Toxiproxy** (by Shopify). It manages the lifecycle of the underlying proxy binary, providing a zero-configuration developer experience via a Node.js CLI.

## Requirements
- Node.js >= 18 (for native fetch in installation; falls back gracefully on older versions)
- Internet access during first install (to download Toxiproxy binary)

## Installation

```bash
npm install -g pughost
```

The installation script automatically detects your operating system (Windows, Linux, macOS) and CPU architecture (x64, arm64), fetching the appropriate Toxiproxy binary. No manual setup or Go installation required.

## Quick Start
1. Initialize: Navigate to your project root and generate the configuration file:

```bash
pughost init
```
This creates pughost.json:
```json

{
  "upstream": "localhost:3000",
  "proxyPort": 3001,
  "scenarios": {
    "mobile_3g_slow": {
      "latency": 600,
      "jitter": 200,
      "bandwidth": 50,
      "packet_loss": 0.01
    },
    "wifi_congested": {
      "latency": 50,
      "jitter": 1000,
      "packet_loss": 0.05
    }
  }
}
```

2. Execute: Start your local backend server normally (e.g., on port 3000). Then activate Pughost:
```bash
pughost start --scenario mobile_3g_slow
```

3. Test: Redirect your API calls (Postman, frontend, mobile simulator) to http://localhost:3001.
- Direct: localhost:3000 (zero latency / dev mode)  
- Proxied: localhost:3001 (simulated conditions / reality mode)

## Scenario Definitions
| Parameter   | Unit | Description |
| :---------: | :---: | :---: |
| latency     | ms | Base round-trip time delay added to the connection. |
| jitter      | ms | Variance in latency (simulates network instability). |
| bandwidth   | kbps | Maximum data transfer rate (simulates throttling; applies downstream). |
| packet_loss | 0.0 – 1.0 | Probability of a packet segment being dropped (simulates interference). |

## License
MIT
