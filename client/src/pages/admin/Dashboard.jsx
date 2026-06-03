import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import Card from '../../components/Card';
import api from '../../services/api';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    api.get('/admin/metrics').then((r) => setMetrics(r.data.metrics));
  }, []);

  return (
    <Layout title="Admin Dashboard">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Users" value={metrics?.users?.total || 0} />
        <StatCard label="Faculty" value={metrics?.users?.faculty || 0} />
        <StatCard label="Students" value={metrics?.users?.students || 0} />
        <StatCard label="Question Papers" value={metrics?.questionPapers || 0} />
      </div>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <StatCard label="Evaluated Exams" value={metrics?.evaluatedExams || 0} />
        <StatCard
          label="Avg Evaluation Score"
          value={`${(metrics?.averageScore || 0).toFixed(1)}%`}
        />
      </div>
      <Card>
        <h2 className="font-semibold mb-4">Admin Tools</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/admin/users" className="text-primary-600 hover:underline">
            Manage Users
          </Link>
          <Link to="/admin/usage" className="text-primary-600 hover:underline">
            API Usage
          </Link>
          <Link to="/admin/logs" className="text-primary-600 hover:underline">
            Audit Logs
          </Link>
        </div>
      </Card>
    </Layout>
  );
}
