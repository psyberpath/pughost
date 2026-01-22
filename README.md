# pughost

> **Localhost is a lie. Test in reality.**

[![npm version](https://img.shields.io/npm/v/pughost.svg)](https://www.npmjs.com/package/pughost)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Your API works flawlessly on localhost. Then it hits production—users on 3G in Lagos, satellite connections in rural areas, congested airport WiFi—and everything breaks. Timeouts, race conditions, spinners that never stop.

**Pughost** injects real-world network chaos into your local development. Find the bugs before your users do.

## What It Does

Pughost is a network simulation layer between your local client and server. It introduces:
- **Latency** — delayed responses (3G, satellite)
- **Jitter** — variable delays (unstable connections)
- **Bandwidth limits** — throttled data transfer
- **Packet loss** — dropped connections

## Installation

```bash
npm install -g pughost
```

Automatically downloads the correct binary for your OS (macOS, Linux, Windows) and architecture (x64, arm64). No manual setup required.

## Quick Start

**1. Initialize** — Generate a config file in your project:

```bash
pughost init
```

This creates `pughost.json`:

```json
{
  "upstream": "localhost:3000",
  "proxyPort": 3001,
  "scenarios": {
    "mobile_3g_slow": { "latency": 1000, "jitter": 500, "bandwidth": 50 },
    "wifi_cafe_crowded": { "latency": 100, "jitter": 800, "packet_loss": 0.05 },
    "satellite_link": { "latency": 800, "bandwidth": 1000 }
  }
}
```

**2. Start your backend** — Run your server on its normal port (e.g., 3000).

**3. Activate chaos** — Start the proxy with a scenario:

```bash
pughost start -s mobile_3g_slow
```

**4. Test through the proxy** — Point your client to `http://localhost:3001` instead of `:3000`.

| Endpoint | Behavior |
|----------|----------|
| `localhost:3000` | Normal (dev mode) |
| `localhost:3001` | Chaos (reality mode) |

## Commands

| Command | Description |
|---------|-------------|
| `pughost init` | Create `pughost.json` config file |
| `pughost list` | Show available scenarios |
| `pughost start -s <name>` | Start proxy with scenario |
| `pughost --help` | Show all commands |

## Scenario Parameters

| Parameter | Unit | Description |
|-----------|------|-------------|
| `latency` | ms | Base delay added to responses |
| `jitter` | ms | Random variance in latency |
| `bandwidth` | kbps | Max data transfer rate |
| `packet_loss` | 0.0–1.0 | Probability of connection drop |

## Use Cases

- **Mobile app testing** — Simulate 3G/4G conditions against your local API
- **Emerging markets** — Test for users in Nigeria, India, Indonesia
- **Resilience testing** — Verify timeout handling, retry logic, loading states
- **QA workflows** — Consistent network conditions for bug reproduction

## How It Works

Pughost wraps [Toxiproxy](https://github.com/Shopify/toxiproxy) (by Shopify) and manages its lifecycle automatically. You get battle-tested chaos engineering without the setup complexity.

## Requirements

- Node.js >= 18
- Internet access on first install (downloads Toxiproxy binary)

## License

MIT © Victor Durosaro
