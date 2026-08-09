import sqlite3
import json
import httpx
import math
import random
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer

app = FastAPI(title="Amazon ML Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_NAME = "amazon_ml.db"

# Load Sentence Transformer Model (lightweight version for quick execution)
print("Loading SentenceTransformer model...")
semantic_model = SentenceTransformer('all-MiniLM-L6-v2')
print("Model loaded.")

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Create tables
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS inventory_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id TEXT,
            month_index INTEGER,
            month_label TEXT,
            stock_level INTEGER
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products_at_risk (
            id TEXT PRIMARY KEY,
            name TEXT,
            current_stock INTEGER,
            predicted_runout TEXT,
            risk_level TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS search_results (
            id TEXT PRIMARY KEY,
            name TEXT,
            price REAL,
            rating REAL,
            reviews INTEGER,
            matches REAL,
            semantic_score REAL,
            popularity_score REAL,
            is_ml_optimized BOOLEAN
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_personas (
            id TEXT PRIMARY KEY,
            name TEXT,
            purchase_history TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS product_catalog (
            id TEXT PRIMARY KEY,
            name TEXT,
            price REAL,
            rating REAL,
            category TEXT
        )
    """)
    
    # Seed Data if empty
    cursor.execute("SELECT COUNT(*) FROM inventory_history")
    if cursor.fetchone()[0] == 0:
        print("Seeding database...")
        # Seed Inventory History for a product
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        # Generate some synthetic data with a trend
        base_stock = 150
        for i in range(8): # Jan to Aug historical data
            stock = int(base_stock + i*15 + random.randint(-20, 20))
            cursor.execute("INSERT INTO inventory_history (product_id, month_index, month_label, stock_level) VALUES (?, ?, ?, ?)", 
                           ("P1", i, months[i], stock))
            
        cursor.executemany("INSERT INTO products_at_risk VALUES (?, ?, ?, ?, ?)", [
            ('B08F7N8P1', 'Echo Dot (4th Gen) Smart Speaker', 142, '12 Days', 'High'),
            ('B07PGL2ZZ', 'Kindle Paperwhite (8GB)', 89, '8 Days', 'Critical'),
            ('B08C1W5N8', 'Fire TV Stick 4K Max', 450, '45 Days', 'Low'),
            ('B08BX7FV5', 'Amazon Basics AA Batteries', 210, '18 Days', 'Medium')
        ])
        
        # Seed Catalog for Recommendations
        catalog = [
            ('c1', 'Mechanical Gaming Keyboard RGB', 89.99, 4.7, 'tech'),
            ('c2', 'Ergonomic Gaming Mouse 16000 DPI', 59.99, 4.8, 'tech'),
            ('c3', '27-inch 144Hz Gaming Monitor', 299.99, 4.6, 'tech'),
            ('c4', 'USB-C Hub Multiport Adapter', 35.00, 4.4, 'tech'),
            ('c5', 'Noise Cancelling Headphones', 199.00, 4.8, 'tech'),
            ('c6', 'Protein Powder Whey Isolate', 45.00, 4.5, 'fitness'),
            ('c7', 'Yoga Mat Non-Slip', 25.00, 4.7, 'fitness'),
            ('c8', 'Resistance Bands Set', 19.99, 4.4, 'fitness'),
            ('c9', 'Adjustable Dumbbells Set', 199.00, 4.8, 'fitness'),
            ('c10', 'Smart Fitness Watch tracker', 149.00, 4.3, 'fitness'),
            ('c11', 'Cast Iron Skillet Pre-Seasoned', 35.00, 4.9, 'home'),
            ('c12', 'Professional Chef Knife 8-inch', 89.00, 4.8, 'home'),
            ('c13', 'High-Speed Blender 1200W', 120.00, 4.6, 'home'),
            ('c14', 'Air Fryer 6 Quart XXL', 110.00, 4.7, 'home'),
            ('c15', 'Dutch Oven Enamel Cast Iron', 65.00, 4.8, 'home'),
            ('c16', 'College Ruled Spiral Notebooks', 15.00, 4.5, 'student'),
            ('c17', 'Laptop Stand Ergonomic', 25.00, 4.6, 'student'),
            ('c18', 'Noise Isolating Earbuds', 45.00, 4.4, 'student'),
            ('c19', 'Backpack with USB Charging', 35.00, 4.7, 'student'),
            ('c20', 'Highlighter Pens Assorted Colors', 9.99, 4.8, 'student'),
            ('c21', 'Gaming Headset with Mic', 75.00, 4.6, 'gamer'),
            ('c22', 'RGB Mousepad XXL', 20.00, 4.7, 'gamer'),
            ('c23', 'Streaming Webcam 1080p', 55.00, 4.5, 'gamer'),
            ('c24', 'Video Game Console Controller', 65.00, 4.8, 'gamer'),
            ('c25', 'Gaming Chair Ergonomic', 189.00, 4.4, 'gamer'),
            ('c26', 'Baby Monitor Video with Camera', 120.00, 4.7, 'parent'),
            ('c27', 'Diaper Bag Backpack', 45.00, 4.8, 'parent'),
            ('c28', 'Baby Stroller Lightweight', 150.00, 4.6, 'parent'),
            ('c29', 'Bottle Warmer Fast Heating', 25.00, 4.5, 'parent'),
            ('c30', 'Infant Car Seat', 199.00, 4.9, 'parent'),
        ]
        cursor.executemany("INSERT INTO product_catalog VALUES (?, ?, ?, ?, ?)", catalog)

        # Seed Personas with purchase history strings (for TF-IDF matching)
        cursor.executemany("INSERT INTO user_personas VALUES (?, ?, ?)", [
            ('tech', 'Tech Enthusiast', json.dumps(['Gaming Monitor 144Hz', 'RGB Mechanical Keyboard switch', 'USB-C Hub dock adapter'])),
            ('fitness', 'Fitness Buff', json.dumps(['Whey Protein Powder supplement', 'Thick Yoga Mat', 'Heavy Resistance Bands'])),
            ('home', 'Home Chef', json.dumps(['Cast Iron Skillet pan', 'Chef Knife sharp steel', 'Blender smoothie maker'])),
            ('student', 'Student', json.dumps(['College Ruled Notebooks', 'Laptop Stand Ergonomic', 'Backpack'])),
            ('gamer', 'Gamer', json.dumps(['Gaming Headset', 'RGB Mousepad', 'Video Game Controller'])),
            ('parent', 'Parent', json.dumps(['Baby Monitor Video', 'Diaper Bag Backpack', 'Infant Car Seat']))
        ])
        
    conn.commit()
    conn.close()
    print("Database initialization complete.")

# Initialize on startup
init_db()

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/api/inventory")
def get_inventory():
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. Fetch historical data for forecasting
    cursor.execute("SELECT month_index, month_label, stock_level FROM inventory_history WHERE product_id='P1' ORDER BY month_index")
    history = cursor.fetchall()
    
    if not history:
        conn.close()
        return {"timeSeries": {"labels": [], "historical": [], "predicted": []}, "productsAtRisk": []}

    df = pd.DataFrame([dict(r) for r in history])
    X = df[['month_index']].values
    y = df['stock_level'].values
    
    # 2. Train a linear regression model
    model = LinearRegression()
    model.fit(X, y)
    
    # 3. Predict the full year (months 0 to 11)
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    all_X = np.array([[i] for i in range(12)])
    predicted_y = model.predict(all_X)
    
    # Prepare historical data (None for future months)
    historical_arr = [None] * 12
    for row in history:
        historical_arr[row['month_index']] = row['stock_level']
        
    # Prepare predicted data (None for past months where we have actual data, except the last historical point to connect lines)
    predicted_arr = [None] * 12
    last_historical_idx = len(history) - 1
    for i in range(12):
        if i >= last_historical_idx:
            predicted_arr[i] = int(predicted_y[i])

    # Fetch at-risk products
    cursor.execute("SELECT * FROM products_at_risk")
    at_risk = cursor.fetchall()
    conn.close()
    
    return {
        "timeSeries": {
            "labels": months,
            "historical": historical_arr,
            "predicted": predicted_arr
        },
        "productsAtRisk": [dict(r) for r in at_risk]
    }

@app.get("/api/search")
async def get_search(query: str = "noise cancelling headphones"):
    api_key = "ECE1DA86408F49DFA35D5C0BD2131D55"
    url = "https://api.rainforestapi.com/request"
    params = {
        "api_key": api_key,
        "type": "search",
        "amazon_domain": "amazon.com",
        "search_term": query
    }
    
    results_list = []
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=15.0)
            data = response.json()
            
            search_results = data.get("search_results", [])[:8] # Take top 8
            
            for index, item in enumerate(search_results):
                price = 0.0
                if "price" in item and "value" in item["price"]:
                    price = float(item["price"]["value"])
                elif "prices" in item and len(item["prices"]) > 0:
                    price = float(item["prices"][0].get("value", 0.0))
                    
                mapped = {
                    "id": item.get("asin", str(index)),
                    "name": item.get("title", "Unknown Product"),
                    "price": price,
                    "rating": float(item.get("rating", 0.0)),
                    "reviews": int(item.get("ratings_total", 0)),
                }
                results_list.append(mapped)
    except Exception as e:
        print(f"Error fetching from Rainforest: {e}")
        # Return empty if fails, or a hardcoded fallback if desired
        pass
        
    if not results_list:
        # Fallback to local catalog if API completely fails
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM product_catalog LIMIT 8")
        db_results = cursor.fetchall()
        conn.close()
        for r in db_results:
            results_list.append({
                "id": r["id"],
                "name": r["name"],
                "price": r["price"],
                "rating": r["rating"],
                "reviews": int(r["rating"] * 100), # fake reviews
            })

    # ML OPTIMIZATION
    query_embedding = semantic_model.encode([query])
    
    for item in results_list:
        # Semantic Score using SentenceTransformers
        title_embedding = semantic_model.encode([item["name"]])
        sim = cosine_similarity(query_embedding, title_embedding)[0][0]
        item["semantic_score"] = round(float(sim), 3)
        
        # Popularity Score (normalized combination of rating and reviews)
        # Using a simple heuristic: (rating/5) * log(reviews + 1)
        # We'll normalize it somewhat
        pop_raw = (item["rating"] / 5.0) * math.log10(item["reviews"] + 1)
        # Normalize pop_raw between roughly 0 and 1 (assuming max reviews ~100k -> log10=5)
        item["popularity_score"] = round(float(min(pop_raw / 5.0, 1.0)), 3)
        
        # Total Match Score
        item["matches"] = round(0.7 * item["semantic_score"] + 0.3 * item["popularity_score"], 3)
        item["is_ml_optimized"] = True

    # We return the original order as "baseline" and the sorted order as "mlOptimized"
    baseline = [dict(item, is_ml_optimized=False) for item in results_list]
    ml_optimized = sorted(results_list, key=lambda x: x["matches"], reverse=True)

    return {
        "query": query,
        "baseline": baseline,
        "mlOptimized": ml_optimized,
        "featureImportances": {
            "semanticMatch": 70,
            "popularity": 30,
            "priceCompetitiveness": 0,
            "personalization": 0
        }
    }

@app.get("/api/recommendations")
def get_recommendations(persona_id: str = "tech"):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM user_personas")
    personas_raw = cursor.fetchall()
    
    # Parse json for recentHistory
    parsed_personas = []
    target_history = []
    found_persona = False
    
    for p in personas_raw:
        d = dict(p)
        history_list = json.loads(d['purchase_history'])
        d['recentHistory'] = history_list
        parsed_personas.append(d)
        if d['id'] == persona_id:
            target_history = history_list
            found_persona = True
            
    cursor.execute("SELECT * FROM product_catalog")
    catalog_raw = cursor.fetchall()
    conn.close()
    
    catalog = [dict(c) for c in catalog_raw]
    
    if not found_persona:
        # Create a synthetic persona profile
        synthetic_persona = {
            "id": persona_id,
            "name": persona_id,
            "recentHistory": [f"Looking for: {persona_id}"]
        }
        parsed_personas.append(synthetic_persona)
        
        # Use Semantic Matching instead of TF-IDF
        query_embedding = semantic_model.encode([persona_id])
        
        recommendations = []
        for item in catalog:
            item_text = f"{item['name']} {item['category']}"
            item_embedding = semantic_model.encode([item_text])
            sim = cosine_similarity(query_embedding, item_embedding)[0][0]
            item['match_score'] = int(sim * 100)
            item['reason'] = f"Semantic match for '{persona_id}' ({item['match_score']}%)"
            recommendations.append(item)
            
        # Sort and take top 5
        recommendations = sorted(recommendations, key=lambda x: x['match_score'], reverse=True)[:5]
        
        return {
            "personas": parsed_personas,
            "recommendations": recommendations
        }
    
    if not target_history:
        return {"personas": parsed_personas, "recommendations": []}

    # Content-Based Recommendation using TF-IDF
    # Combine the user's purchase history into a single "document"
    user_doc = " ".join(target_history)
    
    # Create documents for each item in the catalog
    catalog_docs = [item['name'] for item in catalog]
    
    # Add user document to the list for vectorization
    all_docs = [user_doc] + catalog_docs
    
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(all_docs)
    
    # Calculate cosine similarity between user_doc (index 0) and all catalog items
    cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
    
    # Get top 5 recommendations
    top_indices = cosine_sim.argsort()[-5:][::-1]
    
    recommendations = []
    for idx in top_indices:
        if cosine_sim[idx] > 0: # Only recommend if there's some similarity
            item = catalog[idx]
            item['match_score'] = int(cosine_sim[idx] * 100)
            item['reason'] = f"Based on your purchase history similarity ({item['match_score']}% match)"
            recommendations.append(item)

    return {
        "personas": parsed_personas,
        "recommendations": recommendations
    }
