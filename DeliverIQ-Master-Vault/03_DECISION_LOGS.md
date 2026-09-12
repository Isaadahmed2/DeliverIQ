# 03. Architecture Decision Records (ADR)

## ADR 001: Backend Framework
- **Decision:** Python FastAPI.
- **Rationale:** Native async support, high throughput, immediate in-process integration with Python ML libraries (LightGBM, Pandas, Scikit-learn).

## ADR 002: Machine Learning Model
- **Decision:** LightGBM Classifier with Tabular + Heuristic features.
- **Rationale:** Gradient boosted trees strictly outperform deep neural networks on tabular and mixed feature sets of this scale. Extremely fast inference (< 5ms per order), explainable feature importance.

## ADR 003: WhatsApp Integration Provider
- **Decision:** Evolution API v2 (Self-hosted).
- **Rationale:** Avoids expensive per-conversation Meta Cloud API fees for bootstrapped Pakistani sellers, supports automated QR session connection and webhook incoming event dispatch.

## ADR 004: GIS & Landmark Provider
- **Decision:** OpenStreetMap + Overpass API + Nominatim.
- **Rationale:** Free, zero billing card required, community-mapped Pakistani points of interest (mosques, chowks, commercial markets, bank branches).
