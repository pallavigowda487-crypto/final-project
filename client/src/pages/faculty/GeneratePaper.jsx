import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../services/api';

const BLOOM = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];

export default function GeneratePaper() {
  const [syllabi, setSyllabi] = useState([]);
  const [form, setForm] = useState({
    syllabusId: '',
    numQuestions: 10,
    difficulty: 'Medium',
    bloomLevel: 'Analyze',
  });
  const [loading, setLoading] = useState(false);
  const [paper, setPaper] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/faculty/syllabus').then((r) => {
      const ready = (r.data.syllabi || []).filter((s) => s.status === 'ready');
      setSyllabi(ready);
      if (ready[0]) setForm((f) => ({ ...f, syllabusId: ready[0]._id }));
    });
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPaper(null);
    try {
      const { data } = await api.post('/faculty/papers/generate', form);
      setPaper(data.paper);
    } catch (err) {
      alert(err.response?.data?.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = () => {
    if (!paper) return;
    api.get(`/faculty/papers/${paper._id}/pdf`, { responseType: 'blob' }).then((res) => {
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${paper.subject}-paper.pdf`;
      a.click();
    });
  };

  return (
    <Layout title="Generate Question Paper">
      <Card className="max-w-xl mb-8">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Syllabus</label>
            <select
              value={form.syllabusId}
              onChange={(e) => setForm({ ...form, syllabusId: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
            >
              {syllabi.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.subject}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Number of Questions</label>
            <input
              type="number"
              min={1}
              max={50}
              value={form.numQuestions}
              onChange={(e) => setForm({ ...form, numQuestions: parseInt(e.target.value, 10) })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Difficulty</label>
            <select
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              {['Easy', 'Medium', 'Hard'].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bloom&apos;s Taxonomy</label>
            <select
              value={form.bloomLevel}
              onChange={(e) => setForm({ ...form, bloomLevel: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              {BLOOM.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading || !form.syllabusId}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Generating via RAG...' : 'Generate Paper'}
          </button>
        </form>
      </Card>

      {paper && (
        <Card>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold">{paper.title}</h2>
              <p className="text-slate-500">
                {paper.subject} | {paper.difficulty} | {paper.bloomLevel} | Total: {paper.totalMarks}{' '}
                marks
              </p>
            </div>
            <button onClick={downloadPdf} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm">
              Download PDF
            </button>
          </div>
          <div className="space-y-4">
            {paper.questions?.map((q, i) => (
              <div key={i} className="border-b pb-3">
                <p className="font-medium">
                  {i + 1}. [{q.type}] {q.question} ({q.marks} Marks)
                </p>
                {q.type === 'MCQ' && q.options?.map((o, j) => (
                  <p key={j} className="text-sm text-slate-600 ml-4">
                    {String.fromCharCode(65 + j)}. {o}
                  </p>
                ))}
                <p className="text-sm text-green-700 mt-1">Model: {q.modelAnswer}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/faculty/assign')}
            className="mt-4 text-primary-600 hover:underline"
          >
            Assign this paper to students →
          </button>
        </Card>
      )}
    </Layout>
  );
}
