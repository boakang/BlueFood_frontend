import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { DashboardApp } from './DashboardApp';
import { PublicTracePage } from './PublicTracePage';

function PublicTraceRoute() {
  const { qrToken } = useParams<{ qrToken: string }>();

  if (!qrToken) {
    return <Navigate to="/dashboard/overview" replace />;
  }

  return <PublicTracePage qrToken={qrToken} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard/overview" replace />} />
      <Route path="/dashboard/:tab" element={<DashboardApp />} />
      <Route path="/trace/:qrToken" element={<PublicTraceRoute />} />
      <Route path="*" element={<Navigate to="/dashboard/overview" replace />} />
    </Routes>
  );
}
