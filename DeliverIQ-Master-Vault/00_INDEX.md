# 📦 DeliverIQ — Knowledge Base Master Vault
**Version:** 1.0.0-MVP
**Mission:** Mitigate Pakistan's ~30% e-commerce COD delivery failure & return-to-origin (RTO) fraud through pre-dispatch ML risk scoring and an intelligent multi-agent confirmation workflow.

## 🧭 Vault Navigation
### 1. 🏛️ Master Vault
- [[01_PROJECT_SPECS|Project Specifications & PRD]]: Product scope, Day-1 target customer, pricing, and Pakistani D2C ROI.
- [[02_ARCHITECTURE|System Architecture]]: Multi-agent architecture, data flows, and container layout.
- [[03_DECISION_LOGS|Architecture Decision Records (ADR)]]: Key technical decisions.

### 2. 🎨 Design Sub-Vault (\../DeliverIQ-SubVault-Design/\)
- [[../DeliverIQ-SubVault-Design/UI_UX_Design_System|UI/UX Design System]]: Dark-mode glassmorphic theme tokens.
- [[../DeliverIQ-SubVault-Design/Dashboard_Wireframes|Dashboard Wireframes]]: Live risk map view, time-window selectors (6h/12h/18h/24h), and metrics.
- [[../DeliverIQ-SubVault-Design/Integration_Flows|Integration Flows]]: WhatsApp QR connection, Google Sheets sync, HubSpot integration.
- [[../DeliverIQ-SubVault-Design/Component_Hierarchy|Frontend Component Hierarchy]]: Next.js component tree.

### 3. ⚙️ Backend Sub-Vault (\../DeliverIQ-SubVault-Backend/\)
- [[../DeliverIQ-SubVault-Backend/FastAPI_Architecture|FastAPI Architecture]]: Modular routers, dependencies, and middleware.
- [[../DeliverIQ-SubVault-Backend/Database_Schema|Database Schema]]: PostgreSQL models for orders, agents, and logs.
- [[../DeliverIQ-SubVault-Backend/Agentic_Workflow_Engine|Agentic Workflow Engine]]: Agent 1 (ML Scorer), Agent 2 (WhatsApp), Agent 3 (OSM Geo-Landmark), Agent 4 (Escalation), Agent 5 (CRM Sync).
- [[../DeliverIQ-SubVault-Backend/External_APIs_Integration|External APIs Integration]]: Evolution API, Google Sheets, HubSpot, OSM Overpass, SMTP.
- [[../DeliverIQ-SubVault-Backend/Docker_Deployment|Docker Deployment]]: Multi-container Docker setup.

### 4. 🧠 Machine Learning Sub-Vault (\../DeliverIQ-SubVault-MachineLearning/\)
- [[../DeliverIQ-SubVault-MachineLearning/Synthetic_Dataset_Design|Synthetic Dataset Design]]: Pakistani address and COD fraud patterns.
- [[../DeliverIQ-SubVault-MachineLearning/Feature_Engineering|Feature Engineering]]: NLP heuristics, completeness, phone checks.
- [[../DeliverIQ-SubVault-MachineLearning/Model_Architecture|Model Architecture]]: LightGBM classifier specs and evaluation.
- [[../DeliverIQ-SubVault-MachineLearning/Inference_Pipeline|Inference Pipeline]]: Real-time inference scoring service.
