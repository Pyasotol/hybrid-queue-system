# 🔄 Hybrid Queue System

> A unified engine that synchronizes **PHYSICAL_HARDWARE** and **DIGITAL_APP** queues — linking mechanical artifacts, rotating seasonal plates, and ritual entry workflows into a single coordinated engine.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Status: Active](https://img.shields.io/badge/Status-Active-brightgreen)
![Platform: Hybrid](https://img.shields.io/badge/Platform-Hybrid%20Physical%E2%80%93Digital-blue)

---

## 📖 Overview

The **Hybrid Queue System** bridges the physical and digital worlds through a shared queue architecture. Physical hardware components (rotating plates, gate mechanisms, tactile entry triggers) communicate with a digital application layer (mobile/web apps, remote controllers) using a unified queue and workflow engine.

Whether a participant approaches a physical gate or interacts with the digital app, both signals enter the same unified queue — processed by a single workflow engine that maintains consistency, fairness, and auditability across both domains.

This repository contains the core engine, a hardware integration layer, and example app bindings to demonstrate how physical and digital events can be synchronized and orchestrated.

---

## 📌 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Components](#-components)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Development](#-development)
- [Testing](#-testing)
- [Roadmap](#-future-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

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

This project supports Node.js (TypeScript) for the core engine. Python bindings and tooling may be added in future releases.

> ⚠️ Note: hardware-specific drivers and adapters are platform-dependent. See `docs/hardware-setup.md` for hardware integration notes.

### Prerequisites

- Node.js >= 18
- npm (or yarn)
- An MQTT broker or supported message bus (e.g., Mosquitto, EMQX)
- If using hardware: the appropriate device drivers and access to device interfaces (GPIO, serial, I2C)

### Local development

```bash
# Clone the repository
git clone https://github.com/Pyasotol/hybrid-queue-system.git
cd hybrid-queue-system

# Install dependencies
npm install

# Copy and edit environment config
cp .env.example .env
# Edit .env to configure message bus, hardware adapter, and credentials

# Build (TypeScript)
npm run build

# Start in dev mode (watches files)
npm run dev

# Or run directly with ts-node (for development)
npm run start:dev
```

### Docker (recommended for reproducible environments)

A container image is planned — an example docker-compose setup to run the app with a local MQTT broker:

```yaml
version: '3.8'
services:
  mqtt:
    image: eclipse-mosquitto:2
    ports:
      - '1883:1883'

  app:
    build: .
    environment:
      - MQTT_URL=mqtt://mqtt:1883
    depends_on:
      - mqtt
    ports:
      - '3000:3000'
```

---

## ⚙️ Configuration

Create a `.env` file (see `.env.example`) and set at least the following variables:

- MQTT_URL=mqtt://localhost:1883
- NODE_ENV=development
- PORT=3000
- HARDWARE_ADAPTER=simulator # or gpio, serial, usb

Environment-specific configuration can be loaded using `config/*` or feature flags.

---

## 📚 Usage

The core engine exposes:

- A queue processor that accepts events on two channels: `PHYSICAL_HARDWARE` and `DIGITAL_APP`.
- A REST API (planned) and an event socket for monitoring.
- A rules engine that loads JSON/YAML rule files from `/config/rules/`.

Example: pushing a digital event via the SDK (pseudo-code)

```ts
import { QueueClient } from 'hybrid-queue-sdk';

const client = new QueueClient({ url: process.env.MQTT_URL });

await client.connect();

await client.publish('DIGITAL_APP', {
  type: 'USER_REQUEST',
  payload: { userId: 'abc', action: 'request_entry' }
});
```

Watch the logs or the audit store to see how the workflow engine schedules and resolves the request.

---

## 🔧 Development

- The project uses TypeScript. Source code lives in `src/` and compiled output goes to `dist/`.
- Rules live in `config/rules/` and are hot-reloadable in dev mode.
- Hardware adapters implement the `IHardwareAdapter` interface (see `src/adapters/`), allowing simulator and real-device implementations.

Recommended commands:

- npm run lint
- npm run build
- npm run dev
- npm run test

---

## ✅ Testing

Unit and integration tests should cover:

- Queue ordering guarantees and prioritization
- Workflow rule resolution and conflict scenarios
- Hardware adapter simulations
- Retry and backoff logic

A test runner (Jest) and example test suites will be added under `__tests__/` in v0.2.

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

Contributions are welcome! To make it easy for maintainers to review and accept changes, please follow this process:

1. Open an issue to discuss significant changes or new features.
2. Fork the repository.
3. Create a feature branch named `feature/<short-description>`.
4. Commit changes with clear messages and tests when applicable.
5. Push to your fork and open a Pull Request targeting the `dev` branch.

Guidelines:

- Write tests for new behavior where possible.
- Keep changes small and focused.
- Update documentation when adding or changing features.
- Ensure CI passes (lint, build, test) before requesting review.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

*Built with care for systems that exist at the boundary of the physical and the digital.*
