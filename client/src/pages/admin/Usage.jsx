import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../services/api';

export default function AdminUsage() {
  const [data, setData] = useState({ usage: [], summary: [] });

  useEffect(() => {
    api.get('/admin/api-usage').then((r) => setData(r.data));
  }, []);

  return (
    <Layout title="API Usage Monitoring">
      <Card className="mb-6">
        <h2 className="font-semibold mb-4">Summary (Last 7 Days)</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-slate-500 text-left">
              <th className="py-2">Endpoint</th>
              <th>Requests</th>
              <th>Avg Latency (ms)</th>
            </tr>
          </thead>
          <tbody>
            {(data.summary || []).map((s) => (
              <tr key={s._id} className="border-b">
                <td className="py-2">{s._id}</td>
                <td>{s.count}</td>
                <td>{s.avgLatency?.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card>
        <h2 className="font-semibold mb-4">Recent API Calls</h2>
        <div className="max-h-96 overflow-y-auto text-sm">
          {(data.usage || []).slice(0, 50).map((u) => (
            <div key={u._id} className="border-b py-2 flex justify-between">
              <span>
                {u.method} {u.endpoint}
              </span>
              <span className="text-slate-400">
                {u.latencyMs}ms | {new Date(u.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </Layout>
  );
}
