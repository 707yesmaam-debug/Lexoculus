# LEXOCULUS

### EU AI Act Compliance Platform

**Lexoculus** is a professional-grade compliance engine designed to help developers and organizations align with the **EU AI Act (Regulation (EU) 2024/1689)**. It scans GitHub repositories, detects AI capabilities, classifies risk, and generates legally-referenced compliance reports.

---

## 🔍 CORE FEATURES

- **5-Stage Scan Pipeline**: Deterministic scanner + context-aware LLM analysis.
- **EU AI Act Mapping**: Automatic classification against Annex III high-risk articles.
- **GPAI Detection**: Identifies General-Purpose AI providers and systemic risk.
- **Report Generation**: Digitaly signed PDF compliance reports with evidence trails.
- **CI/CD Integration**: PR scanning via GitHub Actions with risk-based blocking.
- **MCP Server**: Standalone Model Context Protocol server for AI coding assistants.

---

## 🛠 TECHNICAL ARCHITECTURE

Lexoculus operates a sequential pipeline to ensure high-confidence risk assessment:

1.  **SCANNER**: Deterministic AI/ML library detection (200+ library DB).
2.  **LLM ANALYSIS**: Contextual purpose analysis using Groq (Llama 3.3).
3.  **RISK CLASSIFY**: Mapping to Annex III articles via the Constraint Engine.
4.  **CONTEXT VERIFY**: User-provided evidence and use-case refinement.
5.  **REPORT**: Final compliance readiness assessment and PDF generation.

---

## 🚀 GETTING STARTED

### Prerequisites

- Node.js 20+
- PostgreSQL (Supabase recommended)
- Groq API Key (for LLM analysis)
- GitHub OAuth App (for repo scanning)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/CURSED-ME/lexoculus.git
    cd lexoculus
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure environment**:
    Copy `.env.local.example` to `.env.local` and fill in your keys.

4.  **Setup Database**:
    ```bash
    npx prisma generate
    npx prisma db push
    ```

5.  **Run development server**:
    ```bash
    npm run dev
    ```

---

## ⚖️ LICENSE

Lexoculus is released under the **Apache License 2.0**. See [LICENSE](LICENSE) for details.

---

## 🤝 CONTRIBUTING

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to participate in the development of Lexoculus.

---

## 🔒 SECURITY

To report a security vulnerability, please follow the instructions in [SECURITY.md](SECURITY.md).

---

<p align="center">
  <b>OPTICAL LEGALITY SYSTEM 3.0</b><br>
  <i>Safety through Transparency.</i>
</p>
