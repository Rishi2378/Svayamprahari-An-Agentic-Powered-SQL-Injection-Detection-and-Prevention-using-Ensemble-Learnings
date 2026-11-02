# Svayaṃprahari (Suraksha-AI) 🛡️
### An Autonomous Agentic AI Framework for Real-Time SQL Injection Detection, Behavioral Confirmation, and Inline Threat Neutralization

[![Python 3.11](https://img.shields.io/badge/Python-3.11-3776AB.svg?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Backend-Flask-000000.svg?style=flat&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![React + Vite](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![IEEE Paper](https://img.shields.io/badge/Paper-IEEE%20Format-00629B.svg?logo=ieee&logoColor=white)](IEEE_Paper_Latex_Code.txt)

---

## 📌 Executive Summary

**Svayaṃprahari** (named *Suraksha-AI* in deployment) is an autonomous, inline cyber-defense gateway engineered to inspect, classify, and neutralize SQL Injection (SQLi) attacks before malicious payloads reach protected relational databases.

Standard Web Application Firewalls (WAFs) rely on rigid regular expressions easily bypassed by multi-level encoding (Base64, Hexadecimal, Unicode, URL encoding) and comment-splitting tricks. Traditional Machine Learning (ML) classifiers evaluate incoming HTTP payloads as static strings in isolation—they cannot confirm whether a time-delay command (e.g., `SLEEP(5)`) genuinely executed or was simply harmless text.

Svayaṃprahari resolves these limitations through a **Tri-Layer Agentic AI Architecture** operating across nine concurrent, thread-safe software agents. By fusing static signatures, a four-model machine learning voting ensemble, and empirical behavioral correlation engines, the system achieves **100% attack recall (zero false negatives)** in live benchmarking while making deterministic blocking decisions in real time.

---

## 🏗️ System Architecture & Defense Layers

The inspection gateway acts as an inline reverse proxy positioned directly in front of protected web services:

```
                            INCOMING HTTP REQUEST
                                      │
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │       Monitoring Agent (Context Extraction)      │
             └────────────────────────┬─────────────────────────┘
                                      │
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │    Preprocessor Agent (Recursive Normalization)   │
             │       URL ➔ Hex ➔ Base64 ➔ Unicode ➔ Comments    │
             └────────────────────────┬─────────────────────────┘
                                      │
                     ┌────────────────┴────────────────┐
                     ▼                                 ▼
         ┌───────────────────────┐         ┌───────────────────────┐
         │  Layer 1: Rule Engine │ ──High─►│   Prevention Agent    │
         │  50+ Regex Signatures │  Match  │  (HTTP 403 Forbidden) │
         └───────────┬───────────┘         └───────────────────────┘
                     │ Inconclusive                    ▲
                     ▼                                 │
         ┌───────────────────────┐                     │
         │  Layer 2: AI Ensemble │                     │
         │  RF (0.35) + GB (0.25)│                     │
         │ +XGB (0.25) + LSTM (.15)                    │
         └───────────┬───────────┘                     │
                     │ Probabilities                   │
                     ▼                                 │
         ┌───────────────────────┐                     │
         │   Layer 3: Behavior   │                     │
         │ - Latency Correlator  │                     │
         │ - DB Error Stacktrace │                     │
         │ - Out-of-Band Scanner │                     │
         │ - 2nd-Order Session   │                     │
         └───────────┬───────────┘                     │
                     │                                 │
                     ▼                                 │
         ┌───────────────────────┐                     │
         │    Decision Agent     │─── Malicious Verdict┘
         │ Composite Score C_fin │
         └───────────┬───────────┘
                     │ Safe Traffic
                     ▼
         ┌───────────────────────┐         ┌───────────────────────┐
         │  Target Web Backend   │ ◄─────► │    Target Database    │
         │   (Protected Flask)   │         │    (Clean Queries)    │
         └───────────────────────┘         └───────────────────────┘
                     │                                 ▲
                     └────── Async Audit Stream ───────┘
                                      │
                                      ▼
                      ┌───────────────────────────────┐
                      │    React + Vite Dashboard     │
                      │   Real-Time Telemetry (SSE)   │
                      └───────────────────────────────┘
```

### 1. Layer 1: Fast-Path Rule Engine & Recursive Normalizer
- **Recursive Normalizer ($\mathcal{D}$):** Iteratively decodes nested URL encoding, Hexadecimal byte strings (`\x27`, `0x27`), Base64 blocks, and Unicode escapes (`\u0027`), stripping SQL comments (`--`, `/**/`, `#`) until payload idempotency is achieved.
- **50+ Curated Regex Signatures:** Fast-path pattern matching on canonicalized strings. Obvious signature hits ($R \ge 85$) trigger immediate blocking, saving downstream computational cycles.

### 2. Layer 2: Dual N-Gram Feature Engineering & 4-Model ML Ensemble
- **Feature Extraction:** Concatenates character n-grams ($3\text{--}5$), word n-grams ($1\text{--}3$), and a 12-dimensional statistical descriptor including string length, special character density, digit ratio, SQL keyword frequency, and Shannon entropy $H(S')$.
- **Soft-Voting Ensemble:** Combines prediction probabilities from four diverse models:
  $$\mathbf{w} = \bigl(0.35\,\text{RF},\; 0.25\,\text{GB},\; 0.25\,\text{XGB},\; 0.15\,\text{LSTM}\bigr)$$
  - **Random Forest:** 100 estimators providing variance reduction against unseen obfuscations.
  - **Gradient Boosting & XGBoost:** Sequential error correction for refined decision boundaries.
  - **Character-Level LSTM:** 2-layer recurrent network capturing long-range character syntax dependencies.

### 3. Layer 3: Empirical Behavioral Correlation Engines
- **Physical Latency Correlator ($B_{\text{time}}$):** Mathematically confirms time-based blind SQLi by comparing measured server round-trip response time ($t_{\text{obs}}$) against the delay parameter embedded within the payload ($t_{\text{inj}}$):
  $$|t_{\text{obs}} - t_{\text{inj}}| \le 0.50\,\text{s} \implies B_{\text{time}} = 100$$
- **Database Error Leak Parser ($B_{\text{error}}$):** Scans HTTP responses for diagnostic database error strings across MySQL, PostgreSQL, SQLite, MSSQL, and Oracle.
- **Out-of-Band Scanner ($B_{\text{oob}}$):** Detects DNS/HTTP exfiltration attempts (`UTL_HTTP`, `xp_dirtree`, `LOAD_FILE`).
- **Second-Order Session Tracker ($B_{\text{2nd}}$):** Maintains state across requests to detect stored injection payloads that execute in later operations.

---

## 🤖 The 9 Autonomous AI Agents

The framework decouples defensive logic into nine specialized workers running concurrently via Python `threading.Thread` and communicating over a thread-safe Singleton `PriorityMessageBus` (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`):

| Agent Name | Operational Role | Output Contract |
| :--- | :--- | :--- |
| **System Orchestrator** | Liveness supervisor; auto-restarts failed threads within 5s | Worker status registry |
| **Monitoring Agent** | Captures complete HTTP context (URI, headers, body, IP) | Standardized request dictionary |
| **Preprocessor Agent** | Recursively decodes multi-stage obfuscated strings | Canonical payload string $S'$ |
| **Detection Agent** | Executes regex rules and the 4-model ML voting ensemble | Threat probability tuple $(P_{ml}, R)$ |
| **ThreatIntel Agent** | Evaluates client IP reputation and historical attack frequency | Threat reputation score $T \in [0,1]$ |
| **Decision Agent** | Synthesizes multi-tier risk score $C_{\text{fin}}$ | Action verdict ($\text{BLOCK} / \text{ALLOW}$) |
| **Prevention Agent** | Enforces inline HTTP 403 blocks and IP rate-limiting | HTTP 403 Response or proxy forward |
| **Report Agent** | Asynchronously writes to audit DB and pushes SSE events | Audit record + live event stream |
| **PayloadGenerator Agent** | Continuously synthesizes mutated exploit payloads | Automated benchmark test suite |

---

## 📊 Experimental Results & Performance

### Offline ML Model Evaluation (Test Partition: 11,600 Payloads)
Trained on 58,000 labeled samples (50,000 public vulnerability datasets + 8,000 synthetic mutations):

| Model Architecture | Accuracy | Precision | Recall | F1-Score | ROC-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Random Forest (RF) | **1.000** | **1.000** | **1.000** | **1.000** | **1.000** |
| Gradient Boosting (GB) | **1.000** | **1.000** | **1.000** | **1.000** | **1.000** |
| XGBoost (XGB) | **1.000** | **1.000** | **1.000** | **1.000** | **1.000** |
| Character-Level LSTM | 0.950 | 0.942 | 0.958 | 0.950 | 0.980 |
| **Svayaṃprahari Ensemble** | **1.000** | **1.000** | **1.000** | **1.000** | **1.000** |

*Total ensemble training time: **0.791 seconds**.*

### Live Benchmark Evaluation (30 End-to-End HTTP Requests)
Tested against an intentionally vulnerable target application across 11 vulnerability categories:

- **True Positives (TP):** 21 (all 21 attacks intercepted)
- **False Negatives (FN):** 0 (**Recall = 1.000**)
- **True Negatives (TN):** 2 clean requests allowed
- **False Positives (FP):** 7 (malformed inputs containing quote characters triggering strict regex rules)
- **F1-Score:** 0.857
- **Average Gateway Latency:** 2.169 s (including physical 2.0 s time-delay execution windows)

---

## 📁 Repository Structure

```
Suraksha-AI_Project_Phase1/
├── Backend/                       # Core Python Flask Security Gateway
│   ├── agents/                    # 9 Multi-Agent Worker Implementations
│   │   ├── base/                  # BaseAgent interface and lifecycle hooks
│   │   ├── communication/         # PriorityMessageBus (thread-safe Singleton)
│   │   ├── memory/                # In-memory session and IP reputation store
│   │   ├── orchestrator/          # Health supervisor and thread watchdog
│   │   └── plugins/               # Individual agent implementations
│   ├── ai/                        # AI Detection Engine
│   │   ├── models/                # Pre-trained joblib & keras checkpoints
│   │   ├── predictors/            # Soft-voting ensemble and LSTM classifier
│   │   ├── preprocessing/         # Recursive encoding normalizer
│   │   ├── utils/                 # Rule engine, latency & error detectors
│   │   └── vectorizers/           # Dual TF-IDF character and word extractors
│   ├── app/                       # Flask Application Factory & Blueprints
│   │   ├── routes/                # API endpoints (telemetry, logs, target)
│   │   └── models/                # SQLAlchemy database models
│   └── run.py                     # Backend server entry point (:5000)
│
├── Frontend/                      # Modern React + Vite Operator Dashboard
│   ├── src/
│   │   ├── pages/                 # Dashboard, AIDetection, AttackLogs, etc.
│   │   ├── components/            # UI widgets, cards, charts, and tables
│   │   └── services/              # API clients & Server-Sent Events (SSE)
│   ├── package.json
│   └── vite.config.js             # Vite dev configuration (:5173)
│
├── figures/                       # Evaluation plots & ROC curves
│   ├── confusion_matrix.png       # Test partition confusion matrix
│   ├── feature_importance.png     # Key feature contributions
│   ├── precision_recall_curve.png # PR evaluation curve
│   └── roc_curve.png              # ROC-AUC curve (AUC = 1.000)
│
├── tests/ & test_*.py             # Automated test runners for 11 SQLi categories
│   ├── auto_test.py               # Comprehensive benchmark executor
│   ├── test_time_sqli.py          # Latency correlation test
│   ├── test_obfuscated_sqli.py    # Recursive encoding test
│   └── test_second_order.py       # Cross-request session tracking test
│
├── IEEE_Paper_Latex_Code.txt      # Complete 8-Page IEEE Conference Paper Source
├── sqli_test_results.json         # Raw benchmark output telemetry logs
├── run_project.bat                # One-click Windows startup script
└── README.md                      # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.11+** installed and added to PATH
- **Node.js 18+** and **npm** installed

### Quick Start (Windows)
Double-click `run_project.bat` in the root directory. This script automatically:
1. Activates the Python virtual environment and installs backend dependencies.
2. Starts the Flask Gateway server on `http://localhost:5000`.
3. Installs frontend dependencies and launches the Vite React UI on `http://localhost:5173`.

### Manual Setup

#### 1. Backend Setup
```powershell
cd Backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python run.py
```
*Backend runs on `http://localhost:5000`.*

#### 2. Frontend Setup
```powershell
cd Frontend
npm install
npm run dev
```
*Frontend opens at `http://localhost:5173`.*

#### 3. Running Benchmark Tests
To execute the automated 11-category SQLi benchmark test suite:
```powershell
python auto_test.py
```
Results will be output to console and saved in `sqli_test_results.json`.

---

## 📄 Research Paper & Citation

The complete, camera-ready IEEE conference LaTeX source code is available in [`IEEE_Paper_Latex_Code.txt`](IEEE_Paper_Latex_Code.txt).

```bibtex
@inproceedings{svayamprahari2026,
  author    = {CTM Praveen Kumar and Rishi U and M Veeresh and Muruli Mohan and B Sai Kumar},
  title     = {Svaya\d{m}prahari: A Tri-Layer Agentic Artificial Intelligence Framework for Real-Time SQL Injection Detection, Behavioral Confirmation, and Inline Threat Neutralization Using Ensemble Machine Learning and Empirical Latency Correlation},
  booktitle = {Proceedings of the IEEE Conference},
  year      = {2026}
}
```

---

## 👥 Authors & Contributors

* **CTM Praveen Kumar** (`ctm.praveen@gmail.com`)
* **Rishi U** (`rajan28138@gmail.com`)
* **M Veeresh** (`veereshveer.565@gmail.com`)
* **Muruli Mohan** (`muralimohana2003@gmail.com`)
* **B Sai Kumar** (`bsk001188@gmail.com`)

*Department of Artificial Intelligence and Machine Learning, Ballari Institute of Technology and Management, Ballari, Karnataka, India.*

---

## 📜 License
This project is open-source under the [MIT License](LICENSE).
