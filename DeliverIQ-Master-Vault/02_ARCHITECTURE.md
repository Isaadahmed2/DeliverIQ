# 02. System Architecture — DeliverIQ

## High-Level Topology
`
[User Browser]
      | (HTTP/JSON + WebSocket/Polling)
      v
[Next.js 14 Frontend (:3005)]
      | (REST API + JWT Bearer)
      v
[FastAPI Backend (:8000)]
      |
      +---> [PostgreSQL Database (:5433)]
      +---> [Redis Service (:6380)]
      +---> [ML Scoring Service (LightGBM)]
      +---> [Evolution API (WhatsApp) (:8080)]
      +---> [Google Sheets API / HubSpot API]
      +---> [OpenStreetMap / Overpass GIS API]
      +---> [Email Escalation (SMTP/Resend)]
`

## Multi-Agent Decision Matrix
| Condition | Triggered Agents | Action / Output |
|---|---|---|
| **Score $\ge 80$** (Safe) | Agent 1 (ML Scorer) $\rightarrow$ Agent 5 (CRM Sync) | Marked **Approved**. Direct to dispatch. |
| **Score -79$** (Moderate Risk) | Agent 2 (WhatsApp Confirmation) | Interactive WhatsApp message sent with [Confirm] / [Cancel]. On confirm, score boosted (+25) and approved. |
| **Score $< 50$** (High Risk) | Agent 2 + Agent 3 (OSM Geo-Landmark) | Parallel execution: Agent 3 finds 3 closest famous shops/mosques via OSM Overpass; Agent 2 sends WhatsApp offering pickup at nearby spots. |
| **3 Unanswered Attempts** | Agent 4 (Escalation) + Agent 5 (CRM Sync) | Dispatches HTML email report with complete agent audit log to store owner. CRM marked 'Escalated'. |
