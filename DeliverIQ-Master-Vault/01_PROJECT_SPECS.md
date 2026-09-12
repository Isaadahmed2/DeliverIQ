# 01. Project Specifications & PRD — DeliverIQ

## 1. Problem Statement
In Pakistan e-commerce, **Cash-On-Delivery (COD)** accounts for ~85-90% of all orders. However:
- **Return-to-Origin (RTO)** rate is 25-35%.
- Each failed delivery costs the merchant **PKR 300 - 600** in forward + reverse courier charges (TCS, Trax, Leopards, PostEx).
- Fraudulent/fake orders, incorrect addresses (missing house/street), and impulse buyers ignoring the courier cause severe cash burn.

## 2. Solution Overview
DeliverIQ is an autonomous risk-intelligence & order-confirmation SaaS platform:
1. Pre-scores orders using an ML model calibrated on Pakistani address and order attributes (-100$).
2. Automatically engages customers via WhatsApp (Evolution API) for verification.
3. Automatically offers pickup from verified nearby shops/landmarks for high-risk, ambiguous addresses using OpenStreetMap.
4. Escalates persistent non-responses to store owners with audit trails.
5. Continuously syncs two-way state with Google Sheets & HubSpot CRM.

## 3. Day-1 Target Customer
- **Primary:** Shopify & WooCommerce D2C store owners (clothing, cosmetics, electronics, footwear).
- **Secondary:** Instagram / Social Commerce sellers managing orders via Google Sheets.

## 4. Economic ROI & Unit Economics
- **Merchant doing 500 orders/month:**
  - Standard failed orders: 30% = 150 failed orders.
  - Cost of failed delivery @ PKR 400 = **PKR 60,000 / month lost**.
  - DeliverIQ reduces RTO by 15-20% $\rightarrow$ saves 75-100 orders = **PKR 30,000 - 40,000 / month direct savings**.
- **Pricing Strategy (Post-MVP):**
  - Starter: Free for first 50 orders/mo (MVP stage).
  - Growth: PKR 4,999/mo for up to 500 orders (~PKR 10/order).
  - Pro: PKR 14,999/mo for up to 2,000 orders (~PKR 7.5/order).
