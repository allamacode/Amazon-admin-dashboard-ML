'use client';
import { useState, useEffect } from 'react';
import { Search, Info, Star } from 'lucide-react';

export default function SearchTab() {
  const [query, setQuery] = useState("noise cancelling headphones");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async (searchQuery) => {
    setIsSearching(true);
    try {
      const res = await fetch(`http://localhost:8000/api/search?query=${encodeURIComponent(searchQuery)}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch search data:", err);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchData(query);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData(query);
  };

  const renderStars = (rating) => {
    return (
      <div className="product-rating">
        {rating} <Star size={14} fill="#ffa41c" color="#ffa41c" />
      </div>
    );
  };

  if (loading && !data) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading live data...</div>;
  }

  return (
    <div className="animate-fade-in">
      
      {/* Search Bar Area */}
      <div className="glass-panel" style={{ marginBottom: '32px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Search size={20} />
            </div>
            <input 
              type="text" 
              className="input-field" 
              style={{ paddingLeft: '40px' }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={isSearching}>
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      <div className="search-compare">
        
        {/* Baseline Column */}
        <div className="search-column">
          <div className="search-header">
            <h3>Standard Keyword Search</h3>
            <span className="badge badge-warning">BM25 / TF-IDF</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isSearching ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
            ) : data && data.baseline && (
              data.baseline.map((product, index) => (
                <div key={product.id} className="product-card" style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ddd', width: '30px' }}>#{index + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div className="product-title">{product.name}</div>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                      <span className="product-price">${product.price.toFixed(2)}</span>
                      {renderStars(product.rating)}
                      <span className="text-muted">({product.reviews.toLocaleString()})</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ML Optimized Column */}
        <div className="search-column" style={{ border: '1px solid var(--amz-orange)', boxShadow: '0 4px 12px rgba(255, 153, 0, 0.1)' }}>
          <div className="search-header">
            <h3 style={{ color: 'var(--amz-orange)' }}>ML Optimized Ranking</h3>
            <span className="badge badge-success">Deep Learning LTR</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isSearching ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
            ) : data && data.mlOptimized && (
              data.mlOptimized.map((product, index) => (
                <div 
                  key={product.id} 
                  className="product-card" 
                  style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    borderColor: selectedProduct?.id === product.id ? 'var(--amz-orange)' : 'var(--border-color)'
                  }}
                  onClick={() => setSelectedProduct(product)}
                >
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--amz-orange)', width: '30px' }}>#{index + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div className="product-title">{product.name}</div>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                      <span className="product-price">${product.price.toFixed(2)}</span>
                      {renderStars(product.rating)}
                      <span className="text-muted">({product.reviews.toLocaleString()})</span>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '0.75rem', display: 'flex', gap: '8px' }}>
                      <span className="badge" style={{ background: '#eef', color: '#336' }}>Match: {(product.matches * 100).toFixed(0)}%</span>
                      <span className="badge" style={{ background: '#efe', color: '#363' }}>Popularity: {(product.popularity_score * 100).toFixed(0)}</span>
                    </div>
                  </div>
                  <div>
                    <Info size={20} color="var(--text-muted)" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Feature Analysis Modal / Section */}
      {selectedProduct && (
        <div className="glass-panel animate-fade-in" style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3>Ranking Explanation</h3>
              <p className="text-muted">Why did ML rank "{selectedProduct.name}" here?</p>
            </div>
            <button className="btn" onClick={() => setSelectedProduct(null)}>Close</button>
          </div>
          
          <div className="grid-2" style={{ marginTop: '24px' }}>
            <div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px' }}>
                  <span>Semantic Relevance</span>
                  <strong>{(selectedProduct.semantic_score * 100).toFixed(0)}%</strong>
                </div>
                <div className="score-bar"><div className="score-fill" style={{ width: `${selectedProduct.semantic_score * 100}%` }}></div></div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px' }}>
                  <span>Global Popularity Trend</span>
                  <strong>{(selectedProduct.popularity_score * 100).toFixed(0)}%</strong>
                </div>
                <div className="score-bar"><div className="score-fill" style={{ width: `${selectedProduct.popularity_score * 100}%`, background: 'var(--amz-orange)' }}></div></div>
              </div>
            </div>
            <div style={{ background: 'var(--amz-light-blue)', padding: '16px', borderRadius: '8px', fontSize: '0.875rem' }}>
              <p><strong>Model Insight:</strong></p>
              <p style={{ marginTop: '8px' }}>
                While "Generic Wired Headphones" exact-matches the query tokens, the <strong>Semantic Search</strong> model understands the user intent leans towards premium active noise cancelling. Combined with the high <strong>Click-Through Rate (CTR)</strong> and conversion rate for this item, the model boosts its rank significantly.
              </p>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
