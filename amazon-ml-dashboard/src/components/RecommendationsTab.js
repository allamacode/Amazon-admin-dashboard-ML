'use client';
import { useState, useEffect } from 'react';
import { User, History, Star, Sparkles } from 'lucide-react';

export default function RecommendationsTab() {
  const [activePersonaId, setActivePersonaId] = useState('tech');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:8000/api/recommendations?persona_id=${activePersonaId}`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch recommendations:", err);
        setLoading(false);
      });
  }, [activePersonaId]);

  const renderStars = (rating) => {
    return (
      <div className="product-rating">
        {rating} <Star size={14} fill="#ffa41c" color="#ffa41c" />
      </div>
    );
  };

  if (!data) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading live data...</div>;
  }

  const activePersona = data.personas.find(p => p.id === activePersonaId);
  const recommendations = data.recommendations;

  return (
    <div className="animate-fade-in">

      {/* Persona Selector */}
      <div className="glass-panel" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'var(--amz-blue)', padding: '12px', borderRadius: '50%', color: 'white' }}>
              <User size={24} />
            </div>
            <div>
              <h3 style={{ marginBottom: 0 }}>Enter User Persona</h3>
              <p className="text-muted">Type any persona to simulate recommendations, or choose a default</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
            <form onSubmit={(e) => {
              e.preventDefault();
              const val = e.target.elements.customPersona.value.trim();
              if (val) setActivePersonaId(val);
            }}
              style={{ display: 'flex', gap: '8px' }}
            >
              <input
                name="customPersona"
                className="input-field"
                style={{ width: '250px' }}
                placeholder="e.g. Aspiring Musician"
                defaultValue={activePersonaId}
                key={activePersonaId} // forces re-render if activePersonaId changes from pills
              />
              <button type="submit" style={{ background: 'var(--amz-orange)', color: 'white', border: 'none', padding: '0 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Apply</button>
            </form>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxWidth: '350px', justifyContent: 'flex-end' }}>
              {data.personas.filter(p => p.id !== activePersonaId && p.id !== activePersonaId.toLowerCase()).slice(0, 5).map(persona => (
                <button
                  key={persona.id}
                  onClick={() => setActivePersonaId(persona.id)}
                  style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-color)' }}
                >
                  {persona.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '1fr 2fr' }}>

        {/* User History Context */}
        <div className="glass-panel" style={{ alignSelf: 'start' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <History size={20} color="var(--text-muted)" />
            Recent Browsing History
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activePersona?.recentHistory?.map((item, index) => (
              <li key={index} style={{ padding: '12px 16px', background: 'var(--bg-color)', borderRadius: '8px', fontSize: '0.95rem' }}>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* AI Recommendations */}
        <div className="glass-panel">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', color: 'var(--amz-orange)' }}>
            <Sparkles size={20} color="var(--amz-orange)" />
            Recommended For You
          </h3>

          <div className="grid-2">
            {loading ? (
              <div style={{ padding: '20px', color: 'var(--text-muted)' }}>Updating recommendations...</div>
            ) : recommendations.map(product => (
              <div key={product.id} className="product-card" style={{ position: 'relative' }}>

                {/* Match Score Badge */}
                <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--amz-orange)', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  {product.match_score}% Match
                </div>

                <div className="product-image">
                  {product.name.charAt(0)}
                </div>
                <div className="product-title">{product.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <span className="product-price">${product.price.toFixed(2)}</span>
                  {renderStars(product.rating)}
                </div>

                {/* ML Reason */}
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--amz-blue)' }}>Why this item?</span> {product.reason}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
