import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../services/api';

export default function StudentReports() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    api.get('/student/reports').then((r) => setReports(r.data.reports || []));
  }, []);

  const downloadPdf = (id) => {
    api.get(`/student/reports/${id}/pdf`, { responseType: 'blob' }).then((res) => {
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'feedback-report.pdf';
      a.click();
    });
  };

  return (
    <Layout title="Feedback Reports">
      <div className="space-y-4">
        {reports.map((r) => (
          <Card key={r._id}>
            <div className="flex justify-between">
              <div>
                <h3 className="font-semibold">{r.examId?.title}</h3>
                <p className="text-sm text-slate-500">
                  {r.examId?.subject} | Score: {r.examId?.score}/{r.examId?.maxScore}
                </p>
                <p className="text-sm mt-2 text-slate-600 line-clamp-2">{r.feedback}</p>
              </div>
              <button
                onClick={() => downloadPdf(r._id)}
                className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg h-fit"
              >
                Download PDF
              </button>
            </div>
          </Card>
        ))}
        {reports.length === 0 && <p className="text-slate-500">No reports yet.</p>}
      </div>
    </Layout>
  );
}
