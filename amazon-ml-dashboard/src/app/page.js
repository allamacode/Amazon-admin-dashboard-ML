'use client';
import { useState } from 'react';
import { LayoutDashboard, Search, UserCircle, ShoppingCart } from 'lucide-react';
import InventoryTab from '../components/InventoryTab';
import SearchTab from '../components/SearchTab';
import RecommendationsTab from '../components/RecommendationsTab';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('inventory');

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <ShoppingCart size={28} />
          <span>Amazon ML</span>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div 
            className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <LayoutDashboard size={20} />
            Inventory Forecast
          </div>
          <div 
            className={`nav-item ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <Search size={20} />
            Search & Ranking
          </div>
          <div 
            className={`nav-item ${activeTab === 'recommendations' ? 'active' : ''}`}
            onClick={() => setActiveTab('recommendations')}
          >
            <UserCircle size={20} />
            Personalization
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="header">
          <div>
            <h1>
              {activeTab === 'inventory' && 'Inventory Forecasting (ML)'}
              {activeTab === 'search' && 'Search & Ranking Engine'}
              {activeTab === 'recommendations' && 'Personalized Recommendations'}
            </h1>
            <p className="text-muted">Demonstration of machine learning capabilities</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span className="badge badge-success" style={{ alignSelf: 'center', fontSize: '0.875rem', padding: '6px 12px' }}>
              ● Models Online
            </span>
          </div>
        </div>

        {activeTab === 'inventory' && <InventoryTab />}
        {activeTab === 'search' && <SearchTab />}
        {activeTab === 'recommendations' && <RecommendationsTab />}
      </main>
    </div>
  );
}
