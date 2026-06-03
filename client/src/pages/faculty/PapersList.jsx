import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../services/api';

export default function PapersList() {
  const [papers, setPapers] = useState([]);

  useEffect(() => {
    api.get('/faculty/papers').then((r) => setPapers(r.data.papers || []));
  }, []);

  const downloadPdf = (id, subject) => {
    api.get(`/faculty/papers/${id}/pdf`, { responseType: 'blob' }).then((res) => {
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${subject}-paper.pdf`;
      a.click();
    });
  };

  return (
    <Layout title="Generated Papers">
      <div className="space-y-4">
        {papers.map((p) => (
          <Card key={p._id}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{p.title}</h3>
                <p className="text-sm text-slate-500">
                  {p.subject} | {p.difficulty} | {p.bloomLevel} | {p.questions?.length} questions |{' '}
                  {p.totalMarks} marks
                </p>
              </div>
              <div className="flex space-x-2">
                <Link
                  to={`/faculty/papers/${p._id}/edit`}
                  className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg"
                >
                  Edit
                </Link>
                <button
                  onClick={() => downloadPdf(p._id, p.subject)}
                  className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg"
                >
                  PDF
                </button>
              </div>
            </div>
          </Card>
        ))}
        {papers.length === 0 && (
          <p className="text-slate-500">No papers generated yet.</p>
        )}
      </div>
    </Layout>
  );
}
