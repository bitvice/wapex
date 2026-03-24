<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/images/apex_logo_dark.png">
    <img alt="Wapex Logo" src="docs/assets/images/apex_logo.png" width="160">
  </picture>
</p>

# Wapex (WIP) 🚀


> **Wapex** is a premium, high-performance WhatsApp desktop companion built with **Tauri 2** and **Rust**. It is designed for power users who need to manage multiple accounts seamlessly within a single, unified, and productivity-focused workspace.

[![Stability: Experimental](https://img.shields.io/badge/stability-experimental-orange.svg)](https://github.com/bitvice/whatsapp-bv)
[![Powered by Tauri](https://img.shields.io/badge/powered%20by-Tauri-blue.svg)](https://tauri.app)

---

## 🌟 Why Wapex?

Most WhatsApp desktop wrappers are just simple webview clones that consume excessive RAM and lack native system integration. **Wapex** is built from the ground up to feel like a first-class desktop citizen.

### Key Features
- 👥 **Multi-Account Support:** Run multiple WhatsApp sessions simultaneously with 100% isolation (cookies, storage, IndexedDB).
- 🗂️ **Workspaces:** Group accounts into "Work", "Personal", or "Client" workspaces.
- ⚡ **Lightning Fast:** Built on Tauri 2 and Rust for minimal overhead and sub-second account switching.
- 🛠️ **Productivity Tools:** Global Command Palette (`Cmd + K`), quick-reply overlays, and universal search.
- 🔒 **Privacy Focused:** Automated chat blurring, secure session isolation, and no tracking.
- 🍱 **Native Experience:** System tray integration, native OS notifications, and global keyboard shortcuts.

---

## 🏗️ Architecture

Wapex follows a **"Shell & Engines"** model:
- **Core (Rust):** Manages the window lifecycle, secure session data paths, and system-level events.
- **UI (React + Tailwind + Shadcn):** A sleek, modern control plane for managing accounts and workspaces.
- **Engines (Isolated Webviews):** Each WhatsApp account runs in its own hardened webview instance with an injected bridge for native-level features.

For more details, see the [Architecture & Implementation Plan](docs/implementation_plan.md).

---

## 🛠️ Technology Stack

- **Desktop Framework:** [Tauri 2](https://v2.tauri.app/)
- **Backend:** [Rust](https://www.rust-lang.org/)
- **Frontend:** [React](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Database:** SQLite (via tauri-plugin-sql)

---

## 🚀 Getting Started (Development)

> [!NOTE]
> Wapex is currently in active development. Features are being implemented according to the [Roadmap](docs/implementation_plan.md#6-feature-roadmap).

### Prerequisites
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- [Node.js](https://nodejs.org/) (v18+)
- Tauri 2 dependencies (varies by OS)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/bitvice/whatsapp-bv.git
   cd whatsapp-bv
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run in development mode:
   ```bash
   npm run tauri dev
   ```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🤝 Contributing

We welcome contributions! Please check out our [Contributing Guidelines](CONTRIBUTING.md) and the [Roadmap](docs/implementation_plan.md) to see what we're working on. Issues and Pull Requests are welcome.

---

*Wapex is not affiliated, associated, authorized, endorsed by, or in any way officially connected with WhatsApp or Meta Platforms, Inc.*
