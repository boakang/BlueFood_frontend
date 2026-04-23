import React from 'react';
import { BarChart, PieChart } from './DashboardCharts';
import { ChartPoint } from './DashboardApp.constants';

interface OverviewTabProps {
  chartEventTypeData: ChartPoint[];
  certificateCoverage: { complete: number; total: number };
  totalBatches: number;
  totalTraceEvents: number;
  totalCertificatesAttached: number;
}

export function OverviewTab({
  chartEventTypeData,
  certificateCoverage,
  totalBatches,
  totalTraceEvents,
  totalCertificatesAttached
}: OverviewTabProps) {
  return (
    <section className="panel panel-overview">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="result-box" style={{ textAlign: 'center' }}>
          <span style={{ color: '#8ea7c1', fontSize: '0.85rem' }}>Tổng lô hàng</span>
          <strong style={{ display: 'block', fontSize: '2rem', color: '#22d3ee' }}>{totalBatches}</strong>
        </div>
        <div className="result-box" style={{ textAlign: 'center' }}>
          <span style={{ color: '#8ea7c1', fontSize: '0.85rem' }}>Tổng sự kiện trace</span>
          <strong style={{ display: 'block', fontSize: '2rem', color: '#38bdf8' }}>{totalTraceEvents}</strong>
        </div>
        <div className="result-box" style={{ textAlign: 'center' }}>
          <span style={{ color: '#8ea7c1', fontSize: '0.85rem' }}>Chứng chỉ đã gắn</span>
          <strong style={{ display: 'block', fontSize: '2rem', color: '#34d399' }}>{totalCertificatesAttached}</strong>
        </div>
      </div>
      <div className="overview-charts">
        <article className="chart-card">
          <h3>Bar chart: Số lượng sự kiện theo loại</h3>
          <BarChart data={chartEventTypeData} />
        </article>
        <article className="chart-card">
          <h3>Pie chart: Tỷ lệ lô có chứng chỉ gắn</h3>
          <PieChart complete={certificateCoverage.complete} total={certificateCoverage.total} />
        </article>
      </div>
    </section>
  );
}
