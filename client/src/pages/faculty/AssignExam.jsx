import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../services/api';

export default function AssignExam() {
  const [papers, setPapers] = useState([]);
  const [rubrics, setRubrics] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ questionPaperId: '', rubricId: '', studentIds: [], title: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/faculty/papers').then((r) => {
      setPapers(r.data.papers || []);
      if (r.data.papers?.[0]) setForm((f) => ({ ...f, questionPaperId: r.data.papers[0]._id }));
    });
    api.get('/faculty/rubrics').then((r) => {
      setRubrics(r.data.rubrics || []);
    });
    api.get('/faculty/students').then((r) => setStudents(r.data.students || []));
  }, []);

  const toggleStudent = (id) => {
    setForm((f) => ({
      ...f,
      studentIds: f.studentIds.includes(id)
        ? f.studentIds.filter((s) => s !== id)
        : [...f.studentIds, id],
    }));
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!form.questionPaperId || form.studentIds.length === 0) return;
    try {
      await api.post('/faculty/exams/assign', form);
      setMessage(`Exam assigned to ${form.studentIds.length} student(s).`);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Assign failed');
    }
  };

  return (
    <Layout title="Assign Exam">
      <Card className="max-w-xl">
        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Question Paper</label>
            <select
              value={form.questionPaperId}
              onChange={(e) => setForm({ ...form, questionPaperId: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              {papers.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title} — {p.subject}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Evaluation Rubric</label>
            <select
              value={form.rubricId}
              onChange={(e) => setForm({ ...form, rubricId: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="">Default AI Evaluation</option>
              {rubrics.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Exam Title (optional)</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Mid-term Exam"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Select Students</label>
            <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
              {students.map((s) => (
                <label key={s._id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded">
                  <input
                    type="checkbox"
                    checked={form.studentIds.includes(s._id)}
                    onChange={() => toggleStudent(s._id)}
                  />
                  <span>
                    {s.name} ({s.email})
                  </span>
                </label>
              ))}
            </div>
          </div>
          <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded-lg">
            Assign Exam
          </button>
          {message && <p className="text-sm text-green-700">{message}</p>}
        </form>
      </Card>
    </Layout>
  );
}
