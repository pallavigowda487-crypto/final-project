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

  const getCriteriaScores = (report) => {
    if (!report.scoreBreakdown || report.scoreBreakdown.length === 0) return null;

    const criteriaTotals = {};
    const criteriaCounts = {};

    report.scoreBreakdown.forEach((q) => {
      if (q.criteria) {
        Object.entries(q.criteria).forEach(([key, value]) => {
          if (typeof value === 'number') {
            criteriaTotals[key] = (criteriaTotals[key] || 0) + value;
            criteriaCounts[key] = (criteriaCounts[key] || 0) + 1;
          }
        });
      }
    });

    const results = Object.keys(criteriaTotals).map((key) => {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
      const score = Math.round(criteriaTotals[key] / criteriaCounts[key]);
      return { label, score };
    });

    return results.length > 0 ? results : null;
  };

  return (
    <Layout title="Feedback Reports">
      <div className="space-y-4">
        {reports.map((r) => (
          <Card key={r._id}>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{r.examId?.title}</h3>
                    <p className="text-sm text-slate-500 mb-4">
                      {r.examId?.subject} | Overall Score: {r.examId?.score}/{r.examId?.maxScore}
                    </p>
                  </div>
                  <button
                    onClick={() => downloadPdf(r._id)}
                    className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg h-fit"
                  >
                    Download PDF
                  </button>
                </div>
                
                <h4 className="font-medium text-sm text-gray-700">Detailed Feedback</h4>
                <p className="text-sm mt-2 text-slate-600 whitespace-pre-wrap">{r.feedback}</p>
              </div>

              {/* Simple Visual Progress Bars */}
              {getCriteriaScores(r) && (
                <div className="w-full md:w-1/3 bg-slate-50 rounded-lg p-5">
                  <h4 className="font-medium text-sm text-gray-800 mb-4 border-b border-gray-200 pb-2">Rubric Performance</h4>
                  <div className="space-y-4">
                    {getCriteriaScores(r).map((item, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-slate-700">{item.label}</span>
                          <span className="text-slate-600">{item.score}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary-500 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${item.score}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
        {reports.length === 0 && <p className="text-slate-500">No reports yet.</p>}
      </div>
    </Layout>
  );
}
