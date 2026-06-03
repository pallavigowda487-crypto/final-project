import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../services/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);

  const load = () => api.get('/admin/users').then((r) => setUsers(r.data.users || []));
  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (id, isActive) => {
    await api.patch(`/admin/users/${id}`, { isActive: !isActive });
    load();
  };

  return (
    <Layout title="Manage Users">
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b">
                <td className="py-2">{u.name}</td>
                <td>{u.email}</td>
                <td className="capitalize">{u.role}</td>
                <td>{u.isActive ? 'Active' : 'Inactive'}</td>
                <td>
                  <button
                    onClick={() => toggleActive(u._id, u.isActive)}
                    className="text-sm text-primary-600 hover:underline"
                  >
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Layout>
  );
}
