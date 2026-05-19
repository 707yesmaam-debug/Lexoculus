# LEXOCULUS

<p align="center">
  <b>OPTICAL LEGALITY SYSTEM 3.0</b><br>
  <i>Safety through Transparency.</i>
</p>

---

## 📖 OVERVIEW

**Lexoculus** is an enterprise-grade compliance engine designed to help developers and organizations automatically align their software with the **EU AI Act (Regulation (EU) 2024/1689)**.

The EU AI Act introduces strict regulatory requirements for AI systems, classifying them into risk tiers (Minimal, Limited, High-Risk, Unacceptable). Determining your legal obligations manually is an expensive, slow, and error-prone process.

Lexoculus automates this process by scanning your GitHub repositories to detect AI and ML capabilities, classifying the systemic risk based on the Act's Annex III provisions, and generating legally-referenced compliance readiness reports. 

Whether you are building a simple recommendation algorithm or a high-risk biometric identification system, Lexoculus provides a transparent, auditable trail of evidence to keep your code legally compliant.

---

## 🔍 CORE FEATURES

- **5-Stage Scan Pipeline**: Combines deterministic dependency scanning with context-aware LLM analysis.
- **Automated Risk Classification**: Accurately maps your system's purpose against the EU AI Act's Annex III high-risk articles and prohibited practices.
- **GPAI Detection**: Identifies General-Purpose AI models and assesses systemic risk thresholds.
- **Signed Compliance Reports**: Generates digitally signed PDF compliance readiness reports with full evidence trails for auditors.
- **CI/CD Integration**: Seamlessly integrates with GitHub Actions to block pull requests that introduce unacceptable compliance risks.
- **Graphify Knowledge Graph**: Contextual awareness driven by a semantic knowledge graph.
- **MCP Server**: Includes a standalone Model Context Protocol server, allowing AI coding assistants to query your compliance status natively.

---

## 🛠 TECHNICAL ARCHITECTURE

Lexoculus operates a sequential pipeline to ensure high-confidence risk assessment:

1. **SCANNER**: Deterministic AI/ML library detection against a database of 200+ known ML libraries.
2. **LLM ANALYSIS**: Contextual purpose analysis using Groq (Llama 3.3).
3. **RISK CLASSIFY**: Mapping to Annex III articles via the Constraint Engine.
4. **CONTEXT VERIFY**: Refinement of use-cases via user-provided evidence.
5. **REPORT**: Final compliance readiness assessment and signed PDF generation.

---

## 🚀 GETTING STARTED

### Prerequisites

- Node.js 20+
- PostgreSQL (Supabase recommended)
- Groq API Key (for LLM analysis)
- GitHub OAuth App (for repository scanning)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/CURSED-ME/lexoculus.git
   cd lexoculus
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   Copy `.env.local.example` to `.env.local` and fill in your API keys and database credentials.

4. **Setup Database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run development server**:
   ```bash
   npm run dev
   ```

---

## ⚖️ DUAL LICENSING & AGPL-3.0

Lexoculus is proudly open-source and released under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. 

Because AGPL-3.0 is a strong copyleft license, any modifications you make to the platform and host as a networked service (SaaS) **must** be made available to your users under the same open-source terms. See the [LICENSE](LICENSE) file for complete details.

### Commercial Licensing
If your organization requires a proprietary license to embed, modify, or host Lexoculus internally or commercially without being subject to the copyleft obligations of the AGPL, please contact **varadkhoriya17@gmail.com** to purchase a Commercial License.
