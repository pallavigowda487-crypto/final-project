import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import Card from '../../components/Card';
import api from '../../services/api';

export default function FacultyDashboard() {
  const [stats, setStats] = useState({ papers: 0, syllabi: 0, exams: 0 });

  useEffect(() => {
    Promise.all([
      api.get('/faculty/papers'),
      api.get('/faculty/syllabus'),
      api.get('/faculty/performance'),
    ]).then(([papers, syllabi, perf]) => {
      setStats({
        papers: papers.data.papers?.length || 0,
        syllabi: syllabi.data.syllabi?.length || 0,
        exams: perf.data.exams?.length || 0,
      });
    });
  }, []);

  return (
    <Layout title="Faculty Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Uploaded Syllabi" value={stats.syllabi} />
        <StatCard label="Generated Papers" value={stats.papers} />
        <StatCard label="Evaluated Exams" value={stats.exams} />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-col gap-2">
            <Link to="/faculty/syllabus" className="text-primary-600 hover:underline">
              Upload Syllabus
            </Link>
            <Link to="/faculty/generate" className="text-primary-600 hover:underline">
              Generate Question Paper
            </Link>
            <Link to="/faculty/assign" className="text-primary-600 hover:underline">
              Assign Exam to Students
            </Link>
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold mb-2">RAG Pipeline</h2>
          <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
            <li>Upload syllabus PDF/DOCX</li>
            <li>Text extracted and chunked</li>
            <li>Embeddings stored in Pinecone</li>
            <li>Questions generated from retrieved context only</li>
          </ol>
        </Card>
      </div>
    </Layout>
  );
}
