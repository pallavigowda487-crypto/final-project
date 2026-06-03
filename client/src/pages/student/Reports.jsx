import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../services/api';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

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

  const getChartData = (report) => {
    if (!report.scoreBreakdown || report.scoreBreakdown.length === 0) return null;

    // Aggregate criteria across all questions
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

    const labels = [];
    const data = [];
    Object.keys(criteriaTotals).forEach((key) => {
      // Convert camelCase to Title Case for labels
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
      labels.push(label);
      data.push(Math.round(criteriaTotals[key] / criteriaCounts[key])); // Average score out of 100
    });

    if (labels.length === 0) return null;

    return {
      labels,
      datasets: [
        {
          label: 'Average Score (%)',
          data,
          backgroundColor: 'rgba(99, 102, 241, 0.2)', // Indigo 500
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(99, 102, 241, 1)',
        },
      ],
    };
  };

  return (
    <Layout title="Feedback Reports">
      <div className="space-y-4">
        {reports.map((r) => (
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

              {/* Chart Section */}
              {getChartData(r) && (
                <div className="w-full md:w-1/3 flex flex-col items-center justify-center bg-slate-50 rounded-lg p-4">
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Rubric Evaluation Breakdown</h4>
                  <div className="w-full aspect-square max-w-[250px]">
                    <Radar 
                      data={getChartData(r)} 
                      options={{
                        scales: {
                          r: {
                            min: 0,
                            max: 100,
                            ticks: { display: false },
                          }
                        },
                        plugins: { legend: { display: false } }
                      }} 
                    />
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
