import type { ReactElement } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
function PrivateRoute({ children }: { children: ReactElement }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
import { DashboardApp } from './DashboardApp';
import { PublicTracePage } from './PublicTracePage';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';

function PublicTraceRoute() {
  const { qrToken } = useParams<{ qrToken: string }>();

  if (!qrToken) {
    return <Navigate to="/login" replace />;
  }

  return <PublicTracePage qrToken={qrToken} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/dashboard/:tab" element={<PrivateRoute><DashboardApp /></PrivateRoute>} />
      <Route path="/trace/:qrToken" element={<PublicTraceRoute />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
