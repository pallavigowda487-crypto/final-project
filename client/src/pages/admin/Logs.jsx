import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../services/api';

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api.get('/admin/audit-logs').then((r) => setLogs(r.data.logs || []));
  }, []);

  return (
    <Layout title="Audit Logs">
      <Card>
        <div className="max-h-[600px] overflow-y-auto text-sm font-mono">
          {logs.map((l) => (
            <div key={l._id} className="border-b py-2">
              <span className="text-slate-400">{new Date(l.timestamp).toLocaleString()}</span>
              {' | '}
              <span className="text-primary-600">{l.action}</span>
              {' | '}
              {l.userEmail || 'system'} ({l.role})
              {l.resource && ` | ${l.resource}`}
              <span
                className={`ml-2 px-1 rounded text-xs ${
                  l.status === 'success' ? 'bg-green-100' : 'bg-red-100'
                }`}
              >
                {l.status}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </Layout>
  );
}
