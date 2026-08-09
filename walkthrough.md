# Amazon ML Backend Integration

The backend of the Amazon ML Dashboard has been successfully upgraded to use true Machine Learning capabilities and dynamic mock data that accurately reflects a live production database.

## Changes Made

### 1. Database overhaul (`amazon_ml.db`)
- Instead of relying on hardcoded records, the initialization script now **generates a dynamic, trend-based historical warehouse dataset** for inventory forecasting.
- The user personas now include extensive **purchase history documents** (as JSON arrays), rather than pre-associated recommendation targets.
- A **Product Catalog** has been added to act as the baseline recommendation corpus.

### 2. Search ML Optimization (`sentence-transformers`)
- The `/api/search` route now uses `sentence-transformers` (`all-MiniLM-L6-v2`) locally to compute the `semantic_score`.
- When you search, it dynamically measures the real Cosine Similarity between your query text and the live product titles coming from the Rainforest API (or the local catalog if the API fails).
- The `popularity_score` is computed dynamically based on live Amazon ratings and review counts using a logarithmic scaling function.

### 3. Inventory Forecasting (`scikit-learn` Linear Regression)
- The `/api/inventory` endpoint fetches the generated historical data and actively trains a **Linear Regression** model (`sklearn.linear_model.LinearRegression`) on the fly.
- It predicts the future month's stock based strictly on the trends identified in the historical dataset, removing all hardcoded guesses.

### 4. Personalization (`scikit-learn` TF-IDF)
- The `/api/recommendations` endpoint now relies on **Content-Based Filtering**.
- It creates a composite document out of the active Persona's `purchase_history` and vectorizes it against the product catalog using a `TfidfVectorizer`.
- Products are recommended and ranked in real-time based strictly on their TF-IDF cosine similarity to the user's past purchases.

## Validation Results

An automated python script was run to manually verify the endpoints.
- **Inventory Model**: Successfully trained and output 12 months of predictions (historical + forecasted).
- **Search ML**: Successfully vectorized the query "gaming mouse" and returned a dynamic Match Score of `0.764` for the top item.
- **Recommendations**: Successfully matched the `tech` persona history against the catalog, filtering and returning the 4 most mathematically similar items as recommendations.

You can now restart your backend server and see these true ML features active in your frontend!
