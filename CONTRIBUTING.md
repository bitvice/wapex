# Contributing to Wapex

First off, thank you for considering contributing to **Wapex**! It's people like you that make Wapex a great tool for everyone.

Following these guidelines helps to communicate that you respect the time of the developers managing and developing this open source project. In return, they should reciprocate that respect in addressing your issue, assessing changes, and leveling up your submissions.

## Getting Started

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally:
    ```bash
    git clone https://github.com/YOUR_USERNAME/whatsapp-bv.git
    cd whatsapp-bv
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```
4.  **Create a new branch** for your feature or bugfix:
    ```bash
    git checkout -b feature/your-feature-name
    ```

## How to Contribute

### Reporting Bug Reports

*   Check the [issue tracker](https://github.com/bitvice/whatsapp-bv/issues) to ensure the bug hasn't already been reported.
*   If you find a new bug, please provide a clear description and steps to reproduce.

### Suggesting Enhancements

*   Check our [Roadmap](docs/implementation_plan.md) for planned features.
*   Open an issue to discuss your ideas before implementing major changes.

### Pull Requests

1.  Keep PRs focused on a single change.
2.  Ensure your code follows the existing style (we use Prettier and Rustfmt).
3.  Write descriptive commit messages.
4.  Update documentation if necessary.

## Development Stack

*   **Tauri 2**: Core application framework.
*   **Rust**: Backend logic and system integration.
*   **React + Tailwind CSS**: UI/UX.

For more deep-dives, see our [Architecture docs](docs/implementation_plan.md).

---

*By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).*
