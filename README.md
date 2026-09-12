# 📦 DeliverIQ — Autonomous Last-Mile Delivery Risk Scorer & Multi-Agent Confirmation Platform

> Mitigating Pakistan's ~30% e-commerce COD delivery failure & Return-to-Origin (RTO) fraud through pre-dispatch ML risk scoring and an intelligent multi-agent confirmation workflow.

---

## 🚀 Overview

In Pakistan, **Cash-on-Delivery (COD)** powers ~85-90% of all e-commerce transactions. However, merchants lose hundreds of thousands of PKR monthly due to a 25-35% return rate caused by fake orders, ambiguous addresses, and unconfirmed impulse purchases.

**DeliverIQ** changes this by shifting from blind shipping to **pre-dispatch risk intelligence**:
1. **Pre-Dispatch ML Risk Scoring**: Calculates delivery safety score ($0-100$) evaluating address completeness, Pakistani city risk tiers, order value anomalies, and customer history.
2. **Autonomous Multi-Agent Workflow**:
   - **Risk Profiler Agent**: Evaluates order risk dossier.
   - **WhatsApp Negotiation Agent (Evolution API)**: Converses naturally in Roman Urdu/Urdu/English to confirm orders or handle delivery rescheduling.
   - **Geo-Spatial Landmark Agent (OpenStreetMap)**: Identifies 3 nearby prominent shops/mosques for vague addresses to negotiate anchor pickup points.
   - **Human-in-the-Loop Escalator**: Alerts store owners with full audit proof when automated attempts fail.
   - **CRM Sync Agent**: Keeps Google Sheets and HubSpot two-way synchronized.
3. **Executive Dashboard (Next.js)**:
   - Interactive map pinpointing delivery locations color-coded by risk.
   - Real-time KPI cards (RTO savings in PKR, success rates).
   - Batch agent runner (6h / 12h / 18h / 24h filters).

---

## 🏛️ Documentation Vaults (Obsidian)

DeliverIQ is designed with a comprehensive 4-vault documentation system:
- **`DeliverIQ-Master-Vault/`**: Project specs, PRD, system architecture, decision records (ADRs).
- **`DeliverIQ-SubVault-Design/`**: UI/UX design system, dashboard wireframes, component hierarchy.
- **`DeliverIQ-SubVault-Backend/`**: FastAPI architecture, database schemas, agentic workflow engines, external APIs.
- **`DeliverIQ-SubVault-MachineLearning/`**: Synthetic dataset generation, feature engineering, LightGBM classifier specs, inference pipeline.

---

## 🛠️ Tech Stack

- **Backend**: Python FastAPI, SQLAlchemy, PostgreSQL, Redis
- **Frontend**: Next.js 14, React, Tailwind CSS, Lucide Icons, Leaflet / OpenStreetMap
- **Machine Learning**: LightGBM, Scikit-learn, Pandas, NumPy
- **Integrations**: Evolution API (WhatsApp), Google Sheets API v4, HubSpot CRM API, OpenStreetMap / Overpass API
- **Containerization**: Docker & Docker Compose

---

## 📦 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- Git

### Quick Setup
```bash
# Clone the repository
git clone https://github.com/Isaadahmed2/DeliverIQ.git
cd DeliverIQ

# Start backend & frontend services via Docker
docker-compose up -d --build
```

---

## 📄 License
MIT License
