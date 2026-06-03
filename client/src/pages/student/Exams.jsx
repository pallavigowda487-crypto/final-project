import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../services/api';

const statusColors = {
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  submitted: 'bg-orange-100 text-orange-700',
  evaluated: 'bg-green-100 text-green-700',
};

export default function StudentExams() {
  const [exams, setExams] = useState([]);

  useEffect(() => {
    api.get('/student/exams').then((r) => setExams(r.data.exams || []));
  }, []);

  return (
    <Layout title="My Exams">
      <div className="space-y-4">
        {exams.map((e) => (
          <Card key={e._id}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{e.title}</h3>
                <p className="text-sm text-slate-500">
                  {e.subject} | Max: {e.maxScore} marks
                  {e.score != null && ` | Score: ${e.score} (${e.percentage?.toFixed(1)}%)`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs ${statusColors[e.status]}`}>
                  {e.status.replace('_', ' ')}
                </span>
                {e.status !== 'evaluated' ? (
                  <Link
                    to={`/student/exams/${e._id}`}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm"
                  >
                    {e.status === 'in_progress' ? 'Continue' : 'Start'}
                  </Link>
                ) : (
                  <Link to={`/student/exams/${e._id}`} className="text-primary-600 text-sm">
                    View Results
                  </Link>
                )}
              </div>
            </div>
          </Card>
        ))}
        {exams.length === 0 && <p className="text-slate-500">No exams assigned yet.</p>}
      </div>
    </Layout>
  );
}
