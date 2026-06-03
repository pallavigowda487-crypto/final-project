import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../services/api';

export default function TakeExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [results, setResults] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/student/exams/${id}`).then((r) => {
      setExam(r.data.exam);
      setResults(r.data.results);
    });
  }, [id]);

  const handleSubmit = async () => {
    const answerList = Object.entries(answers).map(([questionIndex, answer]) => ({
      questionIndex: parseInt(questionIndex, 10),
      answer,
    }));
    if (answerList.length === 0) return alert('Please answer at least one question');
    setSubmitting(true);
    try {
      const { data } = await api.post(`/student/exams/${id}/submit`, { answers: answerList });
      setExam((e) => ({
        ...e,
        status: 'evaluated',
        score: data.exam.score,
        percentage: data.exam.percentage,
      }));
      setResults({
        answers: data.exam.answers,
        weakTopics: data.exam.weakTopics,
        improvementSuggestions: data.exam.improvementSuggestions,
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!exam) return <Layout><p>Loading...</p></Layout>;

  if (exam.status === 'evaluated' && results) {
    return (
      <Layout title="Exam Results">
        <Card className="mb-6">
          <h2 className="text-xl font-bold">{exam.title}</h2>
          <p className="text-2xl font-bold text-primary-600 mt-2">
            {exam.score} / {exam.maxScore} ({exam.percentage?.toFixed(1)}%)
          </p>
        </Card>
        {results.answers?.map((a, i) => (
          <Card key={i} className="mb-3">
            <p className="font-medium">Question {i + 1}</p>
            <p className="text-sm text-slate-600 mt-1">{a.feedback}</p>
            <p className="text-sm mt-1">
              Marks: {a.marksAwarded}
            </p>
          </Card>
        ))}
        {results.weakTopics?.length > 0 && (
          <Card className="mt-4">
            <h3 className="font-semibold">Weak Topics</h3>
            <ul className="text-sm mt-2">
              {results.weakTopics.map((t, i) => (
                <li key={i}>• {t}</li>
              ))}
            </ul>
          </Card>
        )}
        <button onClick={() => navigate('/student/reports')} className="mt-4 text-primary-600">
          View Reports →
        </button>
      </Layout>
    );
  }

  return (
    <Layout title={exam.title}>
      <p className="text-slate-500 mb-6">
        {exam.subject} | Total: {exam.maxScore} marks
      </p>
      {exam.questions?.map((q) => (
        <Card key={q.index} className="mb-4">
          <p className="font-medium mb-2">
            {q.index + 1}. [{q.type}] {q.question} ({q.marks} marks)
          </p>
          {q.type === 'MCQ' ? (
            <div className="space-y-2">
              {q.options?.map((opt, j) => (
                <label key={j} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`q-${q.index}`}
                    value={String.fromCharCode(65 + j)}
                    checked={answers[q.index] === String.fromCharCode(65 + j)}
                    onChange={() =>
                      setAnswers({ ...answers, [q.index]: String.fromCharCode(65 + j) })
                    }
                  />
                  {String.fromCharCode(65 + j)}. {opt}
                </label>
              ))}
            </div>
          ) : (
            <textarea
              className="w-full border rounded-lg p-3 min-h-[100px]"
              placeholder="Your answer..."
              value={answers[q.index] || ''}
              onChange={(e) => setAnswers({ ...answers, [q.index]: e.target.value })}
            />
          )}
        </Card>
      ))}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="px-8 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
      >
        {submitting ? 'Evaluating with AI...' : 'Submit Exam'}
      </button>
    </Layout>
  );
}
