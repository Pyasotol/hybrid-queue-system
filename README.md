# 🔄 Hybrid Queue System

> A unified engine that synchronizes **PHYSICAL_HARDWARE** and **DIGITAL_APP** queues — linking mechanical artifacts, rotating seasonal plates, and ritual entry workflows into a single coordinated system.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Status: Active](https://img.shields.io/badge/Status-Active-brightgreen)
![Platform: Hybrid](https://img.shields.io/badge/Platform-Hybrid%20Physical%E2%80%93Digital-blue)

---

## 📖 Overview

The **Hybrid Queue System** bridges the physical and digital worlds through a shared queue architecture. Physical hardware components (rotating plates, gate mechanisms, tactile entry triggers) communicate in real time with a digital application layer that tracks state, manages workflows, and orchestrates ritual entry sequences.

Whether a participant approaches a physical gate or interacts with the digital app, both signals enter the same unified queue — processed by a single workflow engine that maintains consistency, fairness, and ritual integrity across both domains.

---

## ✨ Features

- **Dual-Queue Architecture** — Parallel `PHYSICAL_HARDWARE` and `DIGITAL_APP` queues with a shared processor
- **Rotating Plate System** — Seasonal plate rotation logic tied to time-based and event-based triggers
- **Ritual Entry Gate** — A ceremonial gate mechanism with staged unlock sequences and access logging
- **Workflow Engine** — A rule-driven orchestration layer that sequences actions across both queues
- **Real-Time State Sync** — Physical sensor states reflected instantly in the digital layer
- **Event Audit Log** — Full traceability of every queue entry, gate event, and plate rotation
- **Modular Components** — Each subsystem can be developed, tested, and deployed independently
- **Extensible Triggers** — Add new physical or digital triggers without modifying the core engine

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  HYBRID QUEUE SYSTEM                    │
│                                                         │
│  ┌─────────────────────┐  ┌─────────────────────────┐  │
│  │  PHYSICAL_HARDWARE  │  │      DIGITAL_APP        │  │
│  │       QUEUE         │  │        QUEUE            │  │
│  │                     │  │                         │  │
│  │  • Rotating Plates  │  │  • App Events           │  │
│  │  • Gate Sensors     │  │  • User Actions         │  │
│  │  • Entry Triggers   │  │  • Remote Commands      │  │
│  └──────────┬──────────┘  └────────────┬────────────┘  │
│             │                          │               │
│             └────────────┬─────────────┘               │
│                          ▼                             │
│              ┌─────────────────────┐                   │
│              │   WORKFLOW ENGINE   │                   │
│              │  (Rule Orchestrator)│                   │
│              └──────────┬──────────┘                   │
│                         │                              │
│          ┌──────────────┼──────────────┐               │
│          ▼              ▼              ▼               │
│  ┌──────────────┐ ┌──────────┐ ┌──────────────┐       │
│  │ Ritual Entry │ │  Plate   │ │  Audit / Log │       │
│  │    Gate      │ │ Rotation │ │   System     │       │
│  └──────────────┘ └──────────┘ └──────────────┘       │
└─────────────────────────────────────────────────────────┘
```

---

## 🧩 Components

### 🔧 PHYSICAL_HARDWARE Queue

Manages all signals originating from the physical world:

| Component | Description |
|---|---|
| **Rotating Plate System** | Mechanical plates that rotate based on seasonal cycles or manual triggers |
| **Ritual Entry Gate** | A physical gate with staged locking/unlocking sequences |
| **Sensor Array** | Proximity, weight, and motion sensors feeding the queue |
| **Actuator Interface** | Controls motors, solenoids, and display elements |

### 📱 DIGITAL_APP Queue

Manages all signals originating from the application layer:

| Component | Description |
|---|---|
| **App Event Bus** | Captures user interactions and remote commands |
| **State Manager** | Tracks current system state and pending queue items |
| **Notification Layer** | Pushes updates to connected devices and dashboards |
| **Remote Trigger API** | Allows authorized systems to inject events into the queue |

### ⚙️ Workflow Engine

The central orchestration layer that processes both queues:

- **Rule Definitions** — JSON/YAML-based rules that map queue events to actions
- **Priority Scheduler** — Assigns priority weights to physical vs. digital events
- **Conflict Resolver** — Handles simultaneous events from both queues gracefully
- **Retry Logic** — Automatically retries failed actions with configurable backoff

### 🌀 Rotating Plate System

- Tracks the current seasonal plate (Spring / Summer / Autumn / Winter)
- Rotates automatically on schedule or when triggered by either queue
- Emits `PLATE_ROTATED` events consumed by the Workflow Engine
- Physical plate position is mirrored in the digital state layer

### 🚪 Ritual Entry Gate

- Multi-stage unlock sequence (Approach → Verify → Open → Log → Close)
- Accepts unlock signals from both PHYSICAL_HARDWARE and DIGITAL_APP queues
- Emits audit events at every stage transition
- Configurable ceremony mode for special ritual events

---

## 🚀 Installation

> ⚠️ **Work in progress.** Full installation instructions will be published with the v1.0 release.

```bash
# Clone the repository
git clone https://github.com/Pyasotol/hybrid-queue-system.git
cd hybrid-queue-system

# Install dependencies (details TBD)
npm install   # or pip install -r requirements.txt

# Copy environment config
cp .env.example .env

# Start the system
npm run start   # or python main.py
```

**Prerequisites (planned):**
- Node.js ≥ 18 or Python ≥ 3.11
- Hardware interface drivers (see `/docs/hardware-setup.md`)
- MQTT broker or equivalent message bus

---

## 🗺️ Future Roadmap

| Milestone | Feature | Status |
|---|---|---|
| v0.2 | Core queue processor with dual-queue support | 🔄 In Progress |
| v0.3 | Rotating plate seasonal logic + triggers | 📋 Planned |
| v0.4 | Ritual entry gate multi-stage unlock | 📋 Planned |
| v0.5 | Workflow engine rule definitions (JSON/YAML) | 📋 Planned |
| v0.6 | Real-time state sync between hardware & app | 📋 Planned |
| v0.7 | Audit log + event replay system | 📋 Planned |
| v0.8 | Web dashboard for queue monitoring | 📋 Planned |
| v0.9 | Hardware abstraction layer for multi-device support | 📋 Planned |
| v1.0 | Full public release with documentation | 🎯 Target |

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss proposed changes. Pull requests should target the `dev` branch.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

*Built with care for systems that exist at the boundary of the physical and the digital.*
