# 🚔 KSP AI Conversational Assistant

> **Karnataka State Police — Intelligent Crime Analysis Portal**
> Built for Datathon 2026, Track 1

An AI-powered full-stack web application that lets police officers query crime data, analyse FIRs, visualise criminal networks, and generate investigation reports — all through natural language, in English or Kannada.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Frontend Setup](#3-frontend-setup)
  - [4. Running the Application](#4-running-the-application)
- [Environment Variables](#environment-variables)
- [How It Works](#how-it-works)
  - [Intent Routing](#intent-routing)
  - [Text-to-SQL Pipeline](#text-to-sql-pipeline)
  - [RAG Pipeline](#rag-pipeline)
  - [Graph Engine](#graph-engine)
  - [RBAC Security](#rbac-security)
- [API Endpoints](#api-endpoints)
- [Pages and Features](#pages-and-features)
- [Database Schema](#database-schema)
- [RBAC Roles](#rbac-roles)
- [Example Queries](#example-queries)
- [Contributing](#contributing)

---

## Overview

KSP AI Conversational Assistant is a full-stack intelligence portal designed for Karnataka State Police officers. It bridges the gap between raw crime databases and actionable intelligence by letting officers ask questions in plain English (or Kannada) and receive precise, cited answers backed by live database queries, document retrieval, and graph-based network analysis.

---

## Features

| Feature | Description |
|---|---|
| **AI Chat Assistant** | Natural language interface powered by Groq's Llama 3.3 70B model |
| **Text-to-SQL** | Converts questions like "How many burglaries in Mysuru this year?" into live SQL queries |
| **RAG Search** | Retrieves answers from FIR brief facts and uploaded PDF investigation reports using ChromaDB vector search |
| **Criminal Network Graph** | Interactive node-link diagrams showing accused, victims, complainants, and cross-case connections |
| **Crime Map** | Live Leaflet.js map showing active geolocated cases by district |
| **Analytics Dashboard** | Recharts-powered bar and pie charts for crime pattern analysis |
| **PDF Upload & Indexing** | Upload investigative summary PDFs and immediately search them via AI |
| **RBAC Access Control** | Two-tier role system — CONSTABLE vs INSPECTOR — with automatic query filtering |
| **Multilingual Support** | English and Kannada (ಕನ್ನಡ) interface |
| **PDF Report Export** | Generate and download case summary PDFs using jsPDF |
| **New FIR Registration** | Form-based FIR filing with local storage persistence |
| **Case History** | Browse and search previously filed FIRs |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                           │
│  Login → Dashboard (Chat | Summary | Network | Map | Analytics) │
│  New FIR | Case History | Reports | Settings                    │
└────────────────────────────┬────────────────────────────────────┘
                             │  HTTP (Vite proxy → :8000)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FastAPI Backend (:8000)                      │
│                                                                 │
│   POST /api/chat                                                │
│        │                                                        │
│        ├─► RBAC Check (security.py)                             │
│        │                                                        │
│        └─► Intent Router                                        │
│               ├─► text_to_sql.py  →  SQLite (ksp_crime.db)      │
│               ├─► rag_engine.py   →  ChromaDB (vector search)   │
│               └─► graph_engine.py →  SQLite (network queries)   │
│                                                                 │
│   GET  /api/active-cases  →  SQLite (geolocated open cases)     │
│   POST /api/upload-pdf    →  ChromaDB (PDF chunk indexing)      │
│   GET  /health                                                   │
└─────────────────────────────────────────────────────────────────┘
               │                        │
         SQLite DB                 ChromaDB
      (ksp_crime.db)           (./chroma_db/)
   18 seeded KA crime        Sentence-Transformer
       records                  embeddings
```

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | REST API framework |
| **Groq API (Llama 3.3 70B)** | LLM for SQL generation and RAG narration |
| **SQLAlchemy** | ORM and raw SQL execution against SQLite |
| **ChromaDB** | Vector database for semantic similarity search |
| **Sentence-Transformers** (`all-MiniLM-L6-v2`) | Local embeddings — no API key needed |
| **LangChain** | Pipeline orchestration utilities |
| **pypdf** | PDF text extraction for document ingestion |
| **Python-dotenv** | Environment variable management |
| **Uvicorn** | ASGI server |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite** | Build tool and dev server |
| **Tailwind CSS v4** | Utility-first styling |
| **React Router v7** | Client-side routing |
| **Axios** | HTTP client |
| **Recharts** | Crime analytics charts |
| **React-Leaflet + Leaflet.js** | Interactive crime map |
| **@xyflow/react** | Criminal network graph visualisation |
| **react-markdown** | Rendering AI responses as formatted markdown |
| **jsPDF** | PDF report generation |
| **Lucide React + React Icons** | Icon library |

---

## Project Structure

```
ksp-ai-conversational-assistant/
│
├── frontend/                          # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx                    # Root routes and auth guard
│   │   ├── main.jsx                   # React entry point
│   │   ├── index.css                  # Global styles
│   │   ├── translations.js            # English / Kannada strings
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx        # Login state (localStorage)
│   │   │
│   │   ├── pages/
│   │   │   ├── Login/                 # Officer login form
│   │   │   ├── Dashboard/             # Main 5-tab intelligence portal
│   │   │   ├── NewFIR/                # FIR registration form
│   │   │   ├── CaseHistory/           # Filed FIR browser
│   │   │   ├── Reports/               # Report generation page
│   │   │   └── Settings/              # User settings
│   │   │
│   │   ├── components/
│   │   │   ├── layout/                # Header, Sidebar
│   │   │   ├── dashboard/             # StatCard, WelcomeBanner
│   │   │   ├── chat/                  # ChatContainer, ChatWindow,
│   │   │   │                          # ChatMessage, ChatInput,
│   │   │   │                          # CaseSummaryCard
│   │   │   ├── visualization/         # CrimeChart, CrimeMap,
│   │   │   │                          # NetworkGraph, SourceCitation
│   │   │   ├── panel/                 # CrimeDetailsPanel,
│   │   │   │                          # OfficerDetailsPanel
│   │   │   └── common/                # LoadingSpinner
│   │   │
│   │   ├── services/
│   │   │   ├── api.js                 # Axios wrapper for /api/chat
│   │   │   └── caseService.js         # Mock case data + helpers
│   │   │
│   │   └── utils/
│   │       └── pdfGenerator.js        # jsPDF report builder
│   │
│   ├── package.json
│   └── vite.config.js                 # Proxy /api → localhost:8000
│
├── ksp-ai-conversational-assistant/   # Python FastAPI backend
│   ├── main.py                        # FastAPI app, routes, intent router
│   ├── init_db.py                     # One-time DB setup + 18 seed records
│   ├── requirements.txt
│   ├── .env.example                   # Template for environment variables
│   │
│   ├── db/
│   │   └── database.py                # SQLAlchemy engine, run_query, schema
│   │
│   └── pipelines/
│       ├── security.py                # RBAC enforcement
│       ├── text_to_sql.py             # NL → SQL via Groq
│       ├── rag_engine.py              # RAG via ChromaDB + Groq
│       ├── graph_engine.py            # Criminal network builder
│       └── vector_store.py            # ChromaDB collection management
│
├── .gitignore
└── README.md
```

---

## Prerequisites

Make sure you have these installed:

- **Python 3.10+**
- **Node.js 18+** and **npm**
- A free **[Groq API key](https://console.groq.com/)** (the LLM backbone — free tier is sufficient)

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Indusree21/ksp-ai-conversational-assistant.git
cd ksp-ai-conversational-assistant
```

---

### 2. Backend Setup

#### a. Create and activate a virtual environment

```bash
# From the repo root
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate
```

#### b. Install Python dependencies

```bash
cd ksp-ai-conversational-assistant
pip install -r requirements.txt
```

> **Note:** `sentence-transformers` will download the `all-MiniLM-L6-v2` model (~90 MB) on first run. This is a one-time download.

#### c. Configure environment variables

```bash
# Copy the example file
copy .env.example .env        # Windows
cp .env.example .env          # macOS / Linux
```

Edit `.env` and fill in your values:

```env
GROQ_API_KEY=gsk_your_groq_key_here
DB_PATH=ksp_crime.db
CHROMA_PERSIST_DIR=./chroma_db
SECRET_KEY=any-random-secret-string
```

Get your free Groq API key at **https://console.groq.com/**

#### d. Initialise the database

```bash
# Run from inside ksp-ai-conversational-assistant/
python init_db.py
```

This creates `ksp_crime.db` with 18 realistic Karnataka crime records across Bengaluru, Mysuru, Mangaluru, Hubballi, Belagavi, Kalaburagi, Shivamogga, and Tumakuru.

---

### 3. Frontend Setup

```bash
# From the repo root, navigate to frontend
cd ../frontend     # if you were in the backend folder
# or
cd frontend        # from repo root

npm install
```

---

### 4. Running the Application

You need **two terminals** running simultaneously.

#### Terminal 1 — Backend

```bash
# From ksp-ai-conversational-assistant/ (the Python folder)
# Make sure your virtual environment is activated

python main.py
# or
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be live at **http://localhost:8000**

You can browse the auto-generated API docs at **http://localhost:8000/docs**

#### Terminal 2 — Frontend

```bash
# From frontend/
npm run dev
```

The app will be live at **http://localhost:5173**

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | **Yes** | Groq API key for Llama 3.3 70B. Get it free at https://console.groq.com/ |
| `DB_PATH` | No | Path to the SQLite database file. Default: `ksp_crime.db` |
| `CHROMA_PERSIST_DIR` | No | Directory where ChromaDB stores vector embeddings. Default: `./chroma_db` |
| `SECRET_KEY` | No | Secret key for JWT/session signing. Change this in production. |

---

## How It Works

### Intent Routing

Every message sent to `/api/chat` passes through a keyword-based intent classifier before any AI is invoked:

```
Query → RBAC Check → Intent Classifier → Pipeline → Response
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
         text_to_sql      rag          graph
       (SQL keywords)  (describe,    (network,
                        summary,      link, gang,
                        what happened) co-accused)
```

The classifier uses scored keyword lists plus regex force-patterns (e.g. `\bnetwork\b`, `\bgang\b`) to route to the right pipeline. Graph patterns always win over SQL when detected.

---

### Text-to-SQL Pipeline

**File:** `pipelines/text_to_sql.py`

1. A compact schema summary is injected as system context
2. Groq Llama 3.3 70B generates a raw SQLite `SELECT` query
3. For CONSTABLE role, the SQL is inspected and `IsConfidential = 0 AND GravityOffenceID < 3` is injected automatically
4. The query runs against `ksp_crime.db` via SQLAlchemy
5. Up to 20 result rows are sent back to Groq for natural-language narration
6. Structured citations (CaseMaster ID, CrimeNo, Police Station) are extracted

---

### RAG Pipeline

**File:** `pipelines/rag_engine.py` + `pipelines/vector_store.py`

1. On startup, all `BriefFacts` from `CaseMaster` are embedded using `all-MiniLM-L6-v2` and upserted into ChromaDB
2. Uploaded PDFs are chunked (400 chars, 80-char overlap) and also embedded into the same collection
3. At query time, the question is embedded and top-5 nearest documents are retrieved
4. CONSTABLEs automatically have a `IsConfidential = "0"` filter applied to the vector search
5. Retrieved chunks + the original question are sent to Groq for a grounded, cited answer

---

### Graph Engine

**File:** `pipelines/graph_engine.py`

- **Case-specific mode:** If a case ID number is mentioned in the query (e.g. "show network for case 102"), the engine fetches the full network for that exact case — central case node, all accused (red), all victims (blue), all complainants (green), plus cross-case links (other cases the same accused appear in — INSPECTOR only)
- **Keyword mode:** If no case ID is found, the engine searches accused names and BriefFacts by keyword and builds a broader network

The resulting nodes and edges are returned as JSON and rendered interactively using `@xyflow/react`.

---

### RBAC Security

**File:** `pipelines/security.py`

Two roles map to different access levels:

| Officer Rank (Login) | Backend Role | Access Level |
|---|---|---|
| Constable, Head Constable | `CONSTABLE` | Standard cases only. Confidential and high-gravity cases (GravityOffenceID = 3, IsConfidential = 1) are hidden at both query and vector-search level. Sensitive keywords in queries are blocked. |
| Sub Inspector, Inspector, DSP, SP, Commissioner | `INSPECTOR` | Full unrestricted access including classified cases and cross-case network links |

RBAC is enforced at three layers:
1. **Query text check** — keyword scan before any pipeline runs
2. **SQL injection** — `WHERE IsConfidential = 0 AND GravityOffenceID < 3` appended for CONSTABLEs
3. **Vector search filter** — `where={"IsConfidential": {"$eq": "0"}}` in ChromaDB queries

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat` | Main chat endpoint. Accepts `{user_id, role, language, query}`, routes through RBAC + intent classification, returns AI answer with citations and optional graph data |
| `GET` | `/api/active-cases?district=Mysuru` | Returns geolocated open cases for a district (used by the Crime Map tab) |
| `POST` | `/api/upload-pdf` | Accepts a PDF file, parses and indexes it into ChromaDB for RAG retrieval |
| `GET` | `/health` | Health check — returns `{"status": "ok"}` |
| `GET` | `/docs` | Interactive Swagger UI for all endpoints |

### Chat Request / Response

**Request:**
```json
{
  "user_id": "OFFICER_101",
  "role": "INSPECTOR",
  "language": "en",
  "query": "Show all accused in house burglaries in Mysuru"
}
```

**Response:**
```json
{
  "status": "success",
  "query_type": "text_to_sql",
  "answer_text": "There are 2 recorded house burglary cases in Mysuru...",
  "citations": ["CaseMaster ID #101, CrimeNo: 104430006202600001, PS: Mysuru South PS"],
  "graph_data": null,
  "debug": { "sql": "SELECT ...", "row_count": 2 }
}
```

---

## Pages and Features

### Login Page (`/login`)
- Officer logs in with Employee ID, Name, Rank, Police Station, District, and preferred language
- Rank is automatically mapped to a backend RBAC role (`CONSTABLE` or `INSPECTOR`)
- No password validation in this demo — focus is on the AI pipeline

### Dashboard (`/dashboard`)

The main page with five tabs:

| Tab | Description |
|---|---|
| **AI Assistant** | Chat interface. Type any natural language question. The AI responds with formatted text, source citations, and can push results to other tabs |
| **Case Summary** | Detailed FIR profile card for the case selected via the AI chat or map |
| **Criminal Network** | Interactive draggable graph. Node colors: 🔴 Accused, 🔵 Victim, 🟢 Complainant, 🟡 Linked Case |
| **Crime Map** | Live Leaflet map showing active open cases. Click a pin to view brief details or open the full case summary |
| **Analytics** | Bar/pie charts showing crime distribution by type, district, and status |

### New FIR (`/new-fir`)
- Multi-field form to register a new FIR
- Saved to `localStorage` and reflected in the dashboard stat counts

### Case History (`/case-history`)
- Browse and search all previously filed FIRs from `localStorage`

### Reports (`/reports`)
- Generate PDF investigation summaries for any case

### Settings (`/settings`)
- User preferences and configuration

---

## Database Schema

The SQLite database (`ksp_crime.db`) contains 16 tables modelled after the Karnataka Police crime information system:

```
CaseMaster          — Core FIR record (case ID, crime type, date, location, brief facts)
Accused             — Persons accused in a case
Victim              — Victims per case
ComplainantDetails  — Complainant details
ArrestSurrender     — Arrest records linked to accused and cases
ActSectionAssociation — IPC/Act sections applied to each case
CrimeHead           — Major crime category (Body, Property, Women, Economic, Cyber)
CrimeSubHead        — Specific crime type (Murder, Burglary, Vehicle Theft, etc.)
Unit                — Police stations
District            — Karnataka districts
State               — State reference
Employee            — Police officers (investigators)
Rank                — Officer rank hierarchy
CaseStatusMaster    — Case statuses (Under Investigation, Charge Sheet Filed, etc.)
Act                 — Indian Penal Code and other acts
Section             — Sections within each act
```

Key fields on `CaseMaster`:
- `IsConfidential INTEGER` — 1 = restricted (CONSTABLEs cannot see)
- `GravityOffenceID INTEGER` — 3 = high gravity (also restricted)
- `latitude / longitude` — enables map visualisation
- `BriefFacts TEXT` — full-text narrative, embedded into ChromaDB for RAG

---

## RBAC Roles

| Role | Constable / Head Constable | Sub Inspector → Commissioner |
|---|---|---|
| Backend role | `CONSTABLE` | `INSPECTOR` |
| Standard cases | ✅ | ✅ |
| Confidential cases (`IsConfidential = 1`) | ❌ Blocked | ✅ |
| High gravity cases (`GravityOffenceID = 3`) | ❌ Blocked | ✅ |
| Cross-case accused links in Network Graph | ❌ | ✅ |
| Sensitive keyword queries (e.g. "classified", "murder IPC 302") | ❌ Blocked | ✅ |

---

## Example Queries

Try these in the AI Assistant chat:

**Text-to-SQL queries:**
```
How many cases are registered in Mysuru?
List all accused arrested in February 2026
Show all house burglary cases and their status
How many cases are under investigation in Bengaluru?
Count cases by district
Which police station has the most active cases?
```

**RAG / document queries:**
```
What happened in the CCTV robbery case?
Describe the cyber fraud case in Kalaburagi
Tell me about the kidnapping in Mysuru
What are the details of the investment fraud case?
```

**Graph / network queries:**
```
Show criminal network for case 102
Who are the accused in case 117?
Show the network for case 111
Build graph for case 113
```

**Map:**
```
Show me the crime map
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and test them
4. Commit: `git commit -m "Add your feature"`
5. Push: `git push origin feature/your-feature-name`
6. Open a Pull Request

---

*Built for KSP Datathon 2026 — Karnataka State Police Intelligence Portal*
