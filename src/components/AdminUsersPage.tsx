import React, { useEffect, useState } from 'react';
import { approveUser as approveUserApi, getPendingUsers } from '../api';

type PendingUser = {
  userId: number;
  username: string;
  email?: string | null;
  role?: string | null;
  status: string;
  createdAt: string;
};

export function AdminUsersPage() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadPendingUsers = async () => {
    setLoading(true);
    setMessage('');
    try {
      const rows = await getPendingUsers();
      setUsers(rows);
    } catch (error: any) {
      setMessage(error.message || 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPendingUsers();
  }, []);

  const approveUser = async (username: string) => {
    try {
      const result = await approveUserApi(username);
      setMessage(result.message || 'Đã duyệt tài khoản');
      await loadPendingUsers();
    } catch (error: any) {
      setMessage(error.message || 'Lỗi không xác định');
    }
  };

  return (
    <section className="panel panel-wide">
      <h2>Duyệt tài khoản</h2>
      <p className="overview-subtitle">Danh sách tài khoản đang chờ admin duyệt trước khi Active.</p>
      <div className="management-toolbar" style={{ marginBottom: 20 }}>
        <div />
        <button onClick={() => void loadPendingUsers()} className="secondary">
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>
      {message && <div style={{ marginBottom: 16, color: '#7dd3fc' }}>{message}</div>}
      <div className="table-wrap">
        <table className="management-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Tạo lúc</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-cell">Không có tài khoản chờ duyệt.</td>
                </tr>
              )}
              {users.map((user) => (
                <tr key={user.userId}>
                  <td>{user.username}</td>
                  <td>{user.email ?? '-'}</td>
                  <td>{user.role ?? '-'}</td>
                  <td>{user.status}</td>
                  <td>{new Date(user.createdAt).toLocaleString('vi-VN')}</td>
                  <td>
                    <button onClick={() => void approveUser(user.username)} className="secondary">
                      Duyệt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </section>
  );
}