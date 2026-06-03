import React from 'react';
import { ChartPoint } from './DashboardApp.constants';

export function PieChart({ complete, total }: { complete: number; total: number }) {
  const safeTotal = Math.max(total, 1);
  const percent = Math.max(Math.min(complete / safeTotal, 1), 0);
  const circumference = 2 * Math.PI * 44;
  const filled = circumference * percent;

  return (
    <div className="chart chart-pie">
      <svg viewBox="0 0 120 120" role="img" aria-label="Tiến độ quy trình demo">
        <circle cx="60" cy="60" r="44" className="pie-track" />
        <circle
          cx="60"
          cy="60"
          r="44"
          className="pie-fill"
          strokeDasharray={`${filled} ${circumference - filled}`}
        />
      </svg>
      <div className="pie-label">
        <strong style={{ color: '#ffffff' }}>{Math.round(percent * 100)}%</strong>
        <span style={{ color: '#ffffff' }}>{complete} / {total} lô có chứng chỉ</span>
      </div>
    </div>
  );
}

export function LineChart({ data }: { data: ChartPoint[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  const points = data
    .map((item, index) => {
      const x = data.length === 1 ? 10 : 10 + (index / (data.length - 1)) * 80;
      const y = 90 - (item.value / max) * 70;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="chart chart-line">
      <svg viewBox="0 0 100 100" role="img" aria-label="Diễn biến số sự kiện trace">
        <polyline points="10,90 90,90" className="line-axis" />
        <polyline points={points} className="line-path" />
      </svg>
      <div className="line-legend">
        {data.map((item) => (
          <span key={item.label} style={{ color: '#ffffff' }}>{item.label}: <strong style={{ color: '#ffffff' }}>{item.value}</strong></span>
        ))}
      </div>
    </div>
  );
}

export function BarChart({ data }: { data: ChartPoint[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  
  return (
    <div className="chart chart-bar">
      {data.map((item) => {
        const heightPercentage = (item.value / max) * 100;
        return (
          <div key={item.label} className="bar-item">
            <div className="bar-track">
              <div 
                className="bar-fill" 
                style={{ 
                  height: `${heightPercentage}%`,
                  minHeight: item.value > 0 ? '5px' : '0'
                }} 
              />
            </div>
            <strong style={{ color: '#ffffff' }}>{item.value}</strong>
            <span style={{ color: '#ffffff' }}>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
