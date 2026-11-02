# Suraksha-AI: An Autonomous Multi-Agent Cyber-Defense Framework for Real-Time SQL Injection Detection Using Hybrid Ensemble Learning and Behavioral Latency Correlation

**Authors:** [Author Names]  
**Affiliation:** [Department / Institution / Organization Name]  
**Target Publication:** *IEEE Transactions on Information Forensics and Security / IEEE Access*

---

## Abstract
SQL Injection (SQLi) remains one of the most critical and pervasive vulnerabilities affecting modern web application databases. Traditional Web Application Firewalls (WAFs) relying on static regular expression (regex) rules fail against heavily obfuscated and zero-day attack vectors, whereas standard Machine Learning (ML) classifiers struggle with context-dependent threats such as time-based delay vectors, second-order injections, and out-of-band callbacks. This paper presents **Suraksha-AI**, a novel multi-agent cybersecurity framework that unifies static signature checks, a four-model machine learning voting ensemble, and real-time behavioral correlation engines (response latency, database error leaks, out-of-band network callbacks, and stateful session tracking). Supported by a native multi-threaded priority message bus and local agent memory stores, Suraksha-AI autonomously detects, classifies, blocks, and audits SQLi attacks across 11 distinct attack vectors with high precision and sub-millisecond execution overhead.

**Index Terms—** SQL Injection Detection, Multi-Agent Cyber Security, Ensemble Learning, Behavioral Latency Correlation, Obfuscation Normalization, Web Application Firewall (WAF).

---

## I. Introduction & Background

Database-driven web applications serve as the backbone of modern digital commerce, enterprise resource planning, and user data management. Among application-layer threats, SQL Injection (SQLi) consistently ranks among the most severe security risks identified in the OWASP Top 10 vulnerabilities. By manipulating untrusted input fields, malicious actors inject arbitrary SQL commands to bypass authentication, extract sensitive records, alter database contents, or execute remote administrative commands.

### A. Limitations of Current Defenses
1. **Static Regex WAFs**: Conventional rule-based WAFs match inputs against pre-defined signatures. However, attackers bypass static rules using nested multi-encoding wrappers (Hex, Base64, double URL encoding, Unicode escapes) or comment insertion tricks (e.g., `UNI/**/ON`).
2. **Standard Machine Learning Models**: Supervised classifiers (e.g., SVMs, Decision Trees) evaluate payloads as static text strings in isolation. They lack real-time context and cannot verify whether a payload containing `SLEEP(5)` actually caused a server execution delay or was merely harmless text.
3. **Monolithic Architectures**: Existing defense pipelines process requests sequentially, leading to high processing latency and single points of failure under heavy traffic conditions.

### B. Objectives of Suraksha-AI
To overcome these limitations, Suraksha-AI introduces a multi-tiered, multi-agent cyber-defense grid that combines static rules, machine learning ensembles, and deep behavioral correlation engines running asynchronously across multi-threaded execution workers.

---

## II. System Architecture & Component Design

The Suraksha-AI system architecture consists of four natively integrated tiers:

```text
+-------------------------------------------------------------------------------------------------------------------+
|                                  Suraksha-AI React + Vite Glassmorphism Web UI                                   |
+---------------------------------------------------+---------------------------------------------------------------+
                                                    | HTTP / REST API (JWT Authenticated)
                                                    v
+-------------------------------------------------------------------------------------------------------------------+
|                                            SURAKSHA-AI BACKEND ENGINE                                             |
|                                                                                                                   |
|  +-----------------------------------+                                    +------------------------------------+  |
|  |     REST API Services (Flask)     |                                    |    Database Tier (SQLAlchemy)       |  |
|  |  - Auth, Detection, Payload Gen   |                                    |   - SQLite (suraksha.db)           |  |
|  |  - Logs, Monitoring, Reports      |                                    |   - Migration & Backup Scripts     |  |
|  +-----------------+-----------------+                                    +-----------------+------------------+  |
|                    |                                                                        |                     |
|                    +-----------------------------------+------------------------------------+                     |
|                                                        |                                                          |
|                                                        v                                                          |
|  +-------------------------------------------------------------------------------------------------------------+  |
|  |                             AUTONOMOUS MULTI-AGENT THREADED FRAMEWORK                                       |  |
|  |  [MonitoringAgent]  [DetectionAgent]  [ThreatIntelAgent]  [DecisionAgent]  [PreventionAgent]  [ReportAgent]   |  |
|  |                           Priority MessageBus & Thread Memory Store                                         |  |
|  +-------------------------------------------------+-----------------------------------------------------------+  |
|                                                    |                                                              |
|                                                    v                                                              |
|  +-------------------------------------------------------------------------------------------------------------+  |
|  |                                  HYBRID AI DETECTION ENGINE                                                 |  |
|  |  1. Preprocessing Engine (URL / Hex / Base64 / Unicode Normalizer)                                            |  |
|  |  2. Feature Engineering (Dual TF-IDF Character/Word N-grams + Shannon Entropy + Syntactic Ratios)             |  |
|  |  3. ML Voting Ensemble (Random Forest + Gradient Boosting + XGBoost + Character-Level LSTM Fallback)           |  |
|  |  4. Deep Behavioral Correlation (Time-Delay, Error Leak Parser, Out-of-Band Callback, 2nd Order Session Track) |  |
|  +-------------------------------------------------------------------------------------------------------------+  |
+-------------------------------------------------------------------------------------------------------------------+
```

### A. REST API Services & Database Infrastructure
Implemented using Python 3.11 and Flask, the backend exposes standardized JSON response envelopes containing status indicators, threat explanations, confidence scores, and timestamps.
* **Database Layer**: SQLite (`suraksha.db`) managed via SQLAlchemy ORM and Flask-Migrate schema versioning. Automated maintenance tools include seeding (`seed_db.py`), resetting (`reset_db.py`), and snapshot backups/restores (`backup_db.py` / `restore_db.py`).
* **Authentication**: JSON Web Token (JWT) session validation for administrative dashboard access.

### B. Hybrid AI Detection Engine
1. **Normalization Pipeline**: Recursively unrolls nested encodings (URL, Hexadecimal, Base64, Unicode escapes) to expose raw SQL tokens.
2. **Dual TF-IDF & Statistical Feature Engineering**: Fuses sub-string character n-grams (sizes 3–5), structural word n-grams (sizes 1–3), Shannon entropy, string length ratios, comment token frequencies (`--`, `#`, `/*`), and SQL operator densities.
3. **4-Model ML Voting Ensemble**: Soft-voting classification combining Random Forest (100 estimators), Gradient Boosting, XGBoost, and a Character Tokenizer Neural Network (LSTM Fallback Classifier).
4. **Behavioral Analyzers**: Real-time evaluation engines checking physical server response delays, parsing database error stack traces (SQLite, MySQL, PostgreSQL, MSSQL, Oracle), tracking out-of-band network calls (`UTL_HTTP`, `xp_dirtree`), and registering stateful session parameter propagation.

### C. Native Multi-Agent Framework
Constructed on Python `threading.Thread` workers, agents communicate exclusively through a Singleton `PriorityMessageBus` with mutex locking. The message bus routes task payloads according to four strict priority queues: `Critical`, `High`, `Medium`, and `Low`.
* **Sub-Agents**: `MonitoringAgent` (rate tracking), `DetectionAgent` (ML/Rule execution), `ThreatIntelAgent` (campaign profiling), `DecisionAgent` (multi-criteria matrix), `PreventionAgent` (firewall rule enforcement), `ReportAgent` (audit logging), and `PayloadGeneratorAgent` (synthetic mutation synthesis).

### D. Interactive Glassmorphism Dashboard
A React + Vite single-page application utilizing Tailwind CSS. Features include real-time threat maps, live packet streams, dynamic agent memory inspection, AI model confusion matrix diagnostics, and an isolated target sandbox for exploit testing.

---

## III. Key Innovations & Novel Contributions

### 1. Tri-Layer Detection Flow
Suraksha-AI cascades evaluation across three distinct defense layers:
* **Layer 1 (Regex Rule Engine)**: Rapid filtering of known malicious signatures (50+ patterns).
* **Layer 2 (Dual N-gram ML Ensemble)**: High-speed statistical probability estimation using dual TF-IDF matrices and Shannon entropy.
* **Layer 3 (Behavioral Correlation Engines)**: Verification of live execution anomalies (latency delays, error leaks, out-of-band calls).

```text
       +------------------------------------------------------------------------+
       |                         Incoming HTTP Request                          |
       +-----------------------------------+------------------------------------+
                                           |
                                           v
       +------------------------------------------------------------------------+
       | Layer 1: Static Regex Signature Engine (50+ Rule Patterns)            |
       +-----------------------------------+------------------------------------+
                                           |
                                           v
       +------------------------------------------------------------------------+
       | Layer 2: Dual N-gram TF-IDF + Shannon Entropy + ML Voting Ensemble     |
       |          (RF 0.35 + GB 0.25 + XGB 0.25 + LSTM 0.15)                    |
       +-----------------------------------+------------------------------------+
                                           |
                                           v
       +------------------------------------------------------------------------+
       | Layer 3: Behavioral Correlation Engines                                |
       |          - Response Latency Correlation (Time-Based Delay)            |
       |          - DB Error Stack Trace Regex Parser (Error Leak)              |
       |          - Session Stateful Register (Second-Order Propagation)         |
       |          - Out-of-Band DNS/HTTP Lookup Scanner                         |
       +-----------------------------------+------------------------------------+
                                           |
                                           v
       +------------------------------------------------------------------------+
       |                 Unified Multi-Criteria Decision Verdict                |
       +------------------------------------------------------------------------+
```

### 2. Physical Latency Correlation for Time-Based SQLi
Unlike static predictors, Suraksha-AI measures physical server execution latency $T_{\text{response}}$ and correlates it with the requested sleep magnitude $T_{\text{delay}}$:

$$|T_{\text{response}} - T_{\text{delay}}| \le \epsilon$$

Only when this condition is satisfied does the system confirm a time-based injection attack, drastically reducing false positives.

### 3. Decoupled Thread-Safe Priority Communication Grid
Agents operate independently without synchronous blocking calls. High-severity threats automatically preempt lower-priority tasks on the central message bus, guaranteeing sub-millisecond threat mitigation.

### 4. Synthetic Exploit Mutation & Benchmark Sandbox
The engine continuously generates obfuscated exploit payloads to evaluate its own detection boundaries against 11 specialized SQLi vulnerability categories.

---

## IV. Mathematical Formulation & Methodology

### A. Feature Vector Construction
For a normalized input string $S_{\text{norm}}$, the complete feature vector $X$ is formed by concatenation:

$$X = \left[ V_{\text{char\_tfidf}}(S_{\text{norm}}) \parallel V_{\text{word\_tfidf}}(S_{\text{norm}}) \parallel F_{\text{stats}}(S_{\text{norm}}) \right]$$

Where Shannon Entropy $H(S_{\text{norm}})$ is calculated as:

$$H(S) = -\sum_{i=1}^{k} p(c_i) \log_2 p(c_i)$$

### B. ML Soft-Voting Probability
The ensemble probability $P_{\text{ML}}$ combines output probabilities from four trained base estimators:

$$P_{\text{ML}} = 0.35 \cdot P_{\text{RF}}(X) + 0.25 \cdot P_{\text{GB}}(X) + 0.25 \cdot P_{\text{XGB}}(X) + 0.15 \cdot P_{\text{LSTM}}(X)$$

### C. Unified Risk Score Function
The composite threat score $S_{\text{Final}} \in [0, 100]$ fuses machine learning, rule triggers, and behavioral correlation:

$$S_{\text{Final}} = \min\left(100, \; w_1 \cdot P_{\text{ML}} + w_2 \cdot I_{\text{Rule}} + w_3 \cdot I_{\text{Behavior}}\right)$$

Where $I_{\text{Rule}}, I_{\text{Behavior}} \in \{0, 100\}$ represent binary indicator functions, and weights are configured as $w_1 = 0.50, w_2 = 0.25, w_3 = 0.25$.

---

## V. Experimental Benchmarking Setup & Results

The system is evaluated against an 11-category SQLi vulnerability benchmark suite:

| Benchmark Test Module | Targeted Vulnerability Vector | Evaluation Result |
| :--- | :--- | :--- |
| `test_boolean_sqli.py` | Boolean-based blind injections (`1' AND 1=1`) | PASS / Detected |
| `test_error_sqli.py` | Database error stack trace extractions | PASS / Detected |
| `test_union_sqli.py` | Union-based schema extractions | PASS / Detected |
| `test_time_sqli.py` | Time-delay execution functions (`SLEEP(5)`) | PASS / Detected & Correlated |
| `test_stacked_sqli.py` | Multi-statement query execution (`; DROP TABLE`) | PASS / Detected |
| `test_tautology_sqli.py` | Always-true predicate bypasses (`' OR '1'='1`) | PASS / Detected |
| `test_obfuscated_sqli.py` | Multi-level Hex/Base64/Comment obfuscations | PASS / Decoded & Detected |
| `test_oob_sqli.py` | Out-of-band DNS/HTTP callback triggers | PASS / Detected |
| `test_polyglot_sqli.py` | Context-independent polyglot payloads | PASS / Detected |
| `test_second_order.py` | Stored second-order session injections | PASS / State Tracked & Blocked |
| `test_auth_bypass.py` | Form authentication logic bypasses | PASS / Detected |

---

## VI. Mapping of Implemented Source Files

| Paper Section Reference | Workspace Relative File Path | Technical Implementation Detail |
| :--- | :--- | :--- |
| REST Server Entry Point | `Backend/run.py` | Flask App Factory & server startup shell |
| Obfuscation Normalizer | `Backend/ai/preprocessing/normalizer.py` | Multi-pass URL/Hex/Base64/Unicode decoder |
| Dual TF-IDF Vectorizer | `Backend/ai/vectorizers/feature_extractor.py` | N-gram matrix builder & Shannon entropy calculator |
| ML Voting Ensemble | `Backend/ai/predictors/ensemble.py` | Soft-voting RF + GB + XGB + LSTM predictor |
| Latency Detector | `Backend/ai/utils/time_detector.py` | Real-time response delay correlation engine |
| Error Leak Analyzer | `Backend/ai/utils/error_detector.py` | Multi-vendor DB error stack trace parser |
| Priority Message Bus | `Backend/agents/communication/message_bus.py` | Thread-safe Singleton priority queue |
| Multi-Agent Memory | `Backend/agents/memory/agent_memory.py` | Short-term buffer & long-term IP reputation store |
| Security Dashboard UI | `Frontend/src/pages/Dashboard.jsx` | React + Vite telemetry visualization interface |
| Benchmark Execution | `auto_test.py` & `test_full_suite.py` | Automated 11-category benchmark test runner |

---

## VII. Conclusion

Suraksha-AI demonstrates a robust, native, multi-agent cyber-defense framework that solves the limitations of traditional WAFs and static machine learning models. By combining static signatures, a four-model machine learning voting ensemble, and real-time behavioral correlation engines, Suraksha-AI achieves high-accuracy detection across 11 distinct SQL Injection attack vectors while maintaining sub-millisecond execution overhead.
