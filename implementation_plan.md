# Goal Description

Overhaul the Amazon ML Dashboard backend to replace mock data and hardcoded logic with real Machine Learning models and dynamic data connections. This includes generating true semantic match scores for live Amazon search data, using predictive ML models for inventory forecasting, and building a dynamic recommendation engine based on user history.

## User Review Required

> [!IMPORTANT]  
> **Database Environment:** We need to replace the fake, hardcoded SQLite seed data with a "live" database. Since we don't currently have a connection to an external production database (like AWS RDS or Google Cloud SQL), I propose setting up a much larger, dynamically generated dataset within a more robust local database (like a detailed SQLite schema or PostgreSQL if you have it installed locally) to act as our "live warehouse and user history" source. Does this approach work for you, or do you have an external database you want to connect to?

> [!TIP]  
> **Machine Learning Stack:** I plan to introduce the following Python libraries to the backend to power the ML features:
> - `sentence-transformers`: To generate text embeddings and calculate real **Semantic Match Scores** for search queries vs. product titles.
> - `scikit-learn` & `pandas`: To build the **Inventory Forecasting** model (e.g., using linear regression or time-series analysis on historical warehouse data).
> - `scikit-learn` (TF-IDF/Cosine Similarity): To build the **Recommendation Engine** based on a user's purchase history.
>
> *Alternatively*, if you don't want to install heavy local ML models, we could use a cloud API (like the Gemini API) to generate these scores and predictions. Please let me know your preference!

## Open Questions

> [!WARNING]  
> **Rainforest API Key:** The application currently relies on a hardcoded API key for the Rainforest API to fetch live Amazon search data. We will continue using this for the live search data. If this key has expired, the search endpoint will fail. Do you have a valid backup key if needed?

## Proposed Changes

### Backend Dependencies
- **[NEW]** Update `requirements.txt` (or install directly into `venv`) to include `scikit-learn`, `sentence-transformers`, `numpy`, and `pandas`.

### Search Endpoints (ML-Optimized Search)
- **[MODIFY]** `main.py`
  - Implement a `sentence-transformers` model to encode the user's search query and the titles of the live products returned by the Rainforest API.
  - Calculate real cosine similarity to generate the `semantic_score`.
  - Calculate the `popularity_score` algorithmically using a normalized function of the product's `rating` and `reviews` (total ratings).

### Inventory Forecasting (Predictive ML)
- **[MODIFY]** `main.py`
  - Overhaul the `init_db()` function to generate a rich, continuous stream of historical stock data for various products (acting as our live warehouse feed).
  - Update the `/api/inventory` endpoint to train/run a `scikit-learn` forecasting model on the historical data upon request, generating true predicted stock levels instead of returning hardcoded values.

### Recommendations (Collaborative/Content-Based ML)
- **[MODIFY]** `main.py`
  - Expand the database schema to include detailed, realistic user purchase histories.
  - Rewrite `/api/recommendations` to use a dynamic recommendation algorithm (like TF-IDF similarity). It will compare the user's purchase history against a product catalog (or live search data) to dynamically determine the best products to recommend, rather than querying a hardcoded `recommendations` table.

## Verification Plan

### Automated/Manual Verification
- Restart the backend server and ensure all new ML dependencies load successfully without crashing.
- Hit the `/api/search?query=gaming+mouse` endpoint and manually verify that the `semantic_score` and `popularity_score` in the `mlOptimized` array are floating-point numbers derived from the ML model, and that the ranking differs appropriately from the `baseline` array.
- Verify the Inventory dashboard UI dynamically renders predictions that change based on the underlying historical data points, confirming the predictive model is active.
- Verify the Recommendations tab dynamically outputs different product IDs based on the active persona's purchase history vectors.
