import { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import Card from '../../components/Card';
import api from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function FacultyPerformance() {
  const [data, setData] = useState({ exams: [], stats: {} });

  useEffect(() => {
    api.get('/faculty/performance').then((r) => setData(r.data));
  }, []);

  const subjects = Object.keys(data.stats?.bySubject || {});
  const chartData = {
    labels: subjects,
    datasets: [
      {
        label: 'Average Score %',
        data: subjects.map((s) => data.stats.bySubject[s].avg?.toFixed(1)),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
      },
    ],
  };

  return (
    <Layout title="Student Performance">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <StatCard label="Total Evaluated Exams" value={data.stats?.totalExams || 0} />
        <StatCard
          label="Average Score"
          value={`${(data.stats?.averageScore || 0).toFixed(1)}%`}
        />
      </div>
      {subjects.length > 0 && (
        <Card className="mb-8 max-w-2xl">
          <h2 className="font-semibold mb-4">Subject Analytics</h2>
          <Bar data={chartData} options={{ responsive: true, scales: { y: { max: 100 } } }} />
        </Card>
      )}
      <Card>
        <h2 className="font-semibold mb-4">Recent Results</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-slate-500 text-left">
              <th className="py-2">Student</th>
              <th>Exam</th>
              <th>Score</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            {(data.exams || []).map((e) => (
              <tr key={e._id} className="border-b">
                <td className="py-2">{e.studentId?.name}</td>
                <td>{e.title}</td>
                <td>
                  {e.score}/{e.maxScore}
                </td>
                <td>{e.percentage?.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Layout>
  );
}
