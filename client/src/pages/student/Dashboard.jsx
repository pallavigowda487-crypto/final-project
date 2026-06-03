import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import Card from '../../components/Card';
import api from '../../services/api';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function StudentDashboard() {
  const [dash, setDash] = useState(null);

  useEffect(() => {
    api.get('/student/dashboard').then((r) => setDash(r.data.dashboard));
  }, []);

  const chartData = dash?.examHistory?.length
    ? {
        labels: dash.examHistory.map((e) => e.title?.slice(0, 20)),
        datasets: [
          {
            data: dash.examHistory.map((e) => e.percentage),
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
          },
        ],
      }
    : null;

  return (
    <Layout title="Student Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Exams Taken" value={dash?.examHistory?.length || 0} />
        <StatCard label="Average Score" value={`${(dash?.averageScore || 0).toFixed(1)}%`} />
        <StatCard label="Weak Topics" value={dash?.weakTopics?.length || 0} />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {chartData && (
          <Card>
            <h2 className="font-semibold mb-4">Score Overview</h2>
            <Doughnut data={chartData} />
          </Card>
        )}
        <Card>
          <h2 className="font-semibold mb-4">Improvement Suggestions</h2>
          <ul className="text-sm space-y-2 text-slate-600">
            {(dash?.improvementSuggestions || ['Complete assigned exams to get suggestions.']).map(
              (s, i) => (
                <li key={i}>• {s}</li>
              )
            )}
          </ul>
          <Link to="/student/exams" className="inline-block mt-4 text-primary-600 hover:underline">
            View My Exams →
          </Link>
        </Card>
      </div>
      {dash?.weakTopics?.length > 0 && (
        <Card className="mt-6">
          <h2 className="font-semibold mb-2">Weak Topics</h2>
          <div className="flex flex-wrap gap-2">
            {dash.weakTopics.map((t, i) => (
              <span key={i} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm">
                {t.topic} ({t.count}x)
              </span>
            ))}
          </div>
        </Card>
      )}
    </Layout>
  );
}
