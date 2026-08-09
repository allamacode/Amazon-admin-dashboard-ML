'use client';
import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { AlertTriangle, PackageSearch } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function InventoryTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/inventory')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch inventory data:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading live data...</div>;
  }

  if (!data) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>Error loading data. Ensure the backend is running.</div>;
  }

  const chartData = {
    labels: data.timeSeries.labels,
    datasets: [
      {
        label: 'Historical Stock',
        data: data.timeSeries.historical,
        borderColor: '#007185',
        backgroundColor: 'rgba(0, 113, 133, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'ML Forecast',
        data: data.timeSeries.predicted,
        borderColor: '#ff9900',
        backgroundColor: 'rgba(255, 153, 0, 0.1)',
        fill: true,
        tension: 0.4,
        borderDash: [5, 5],
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      y: { beginAtZero: true }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  return (
    <div className="animate-fade-in">
      
      {/* Top metrics / Chart */}
      <div className="glass-panel" style={{ marginBottom: '32px', height: '400px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PackageSearch size={20} color="var(--amz-blue)" />
          Global Inventory Forecast (Next 6 Months)
        </h3>
        <div style={{ height: '320px', marginTop: '16px' }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Table for items at risk */}
      <div className="glass-panel">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <AlertTriangle size={20} color="var(--danger)" />
          Products at Risk of Stockout
        </h3>
        
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Product ID</th>
                <th>Product Name</th>
                <th>Current Stock</th>
                <th>Predicted Runout</th>
                <th>Risk Level</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.productsAtRisk.map((product) => (
                <tr key={product.id}>
                  <td style={{ fontFamily: 'monospace' }}>{product.id}</td>
                  <td style={{ fontWeight: 500 }}>{product.name}</td>
                  <td>{product.currentStock} units</td>
                  <td>
                    <span style={{ fontWeight: 600, color: product.riskLevel === 'Critical' ? 'var(--danger)' : 'inherit' }}>
                      {product.predictedRunout}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${product.riskLevel === 'Critical' ? 'danger' : product.riskLevel === 'High' ? 'warning' : 'success'}`}>
                      {product.riskLevel}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                      Reorder via Vendor
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
