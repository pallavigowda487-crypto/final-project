import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../services/api';

export default function EditPaper() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paper, setPaper] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get(`/faculty/papers/${id}`).then((res) => {
      setPaper(res.data.paper);
      setQuestions(res.data.paper.questions || []);
      setLoading(false);
    }).catch((err) => {
      setMessage('Failed to load paper details');
      setLoading(false);
    });
  }, [id]);

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const updated = [...questions];
    const newOptions = [...updated[qIndex].options];
    newOptions[optIndex] = value;
    updated[qIndex].options = newOptions;
    setQuestions(updated);
  };

  const deleteQuestion = (index) => {
    const updated = [...questions];
    updated.splice(index, 1);
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        type: 'Short Answer',
        question: '',
        modelAnswer: '',
        marks: 5,
        bloomLevel: 'Understand',
        difficulty: 'Medium',
        options: ['', '', '', ''],
      },
    ]);
  };

  const saveChanges = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.put(`/faculty/papers/${id}`, { questions });
      setMessage('Question paper updated successfully!');
      setTimeout(() => navigate('/faculty/papers'), 1500);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update paper');
      setSaving(false);
    }
  };

  if (loading) return <Layout title="Edit Paper"><p>Loading...</p></Layout>;
  if (!paper) return <Layout title="Edit Paper"><p className="text-red-500">{message}</p></Layout>;

  return (
    <Layout title={`Edit Paper: ${paper.title}`}>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">{paper.subject}</h2>
          <p className="text-slate-500 text-sm">
            Total Questions: {questions.length} | 
            Total Marks: {questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0)}
          </p>
        </div>
        <div className="space-x-3">
          <button onClick={() => navigate('/faculty/papers')} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</button>
          <button onClick={saveChanges} disabled={saving} className="px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {message && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">{message}</div>}

      <div className="space-y-6">
        {questions.map((q, index) => (
          <Card key={index} className="relative">
            <div className="absolute top-4 right-4 space-x-2">
              <button onClick={() => deleteQuestion(index)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
            </div>
            <div className="flex gap-4 mb-4">
              <span className="font-bold text-lg text-primary-600">Q{index + 1}.</span>
              <div className="flex-1 space-y-4">
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                    <select
                      value={q.type}
                      onChange={(e) => handleQuestionChange(index, 'type', e.target.value)}
                      className="w-full text-sm p-2 border rounded"
                    >
                      <option>MCQ</option>
                      <option>Short Answer</option>
                      <option>Long Answer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Marks</label>
                    <input
                      type="number"
                      value={q.marks}
                      onChange={(e) => handleQuestionChange(index, 'marks', e.target.value)}
                      className="w-full text-sm p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Bloom's Level</label>
                    <select
                      value={q.bloomLevel}
                      onChange={(e) => handleQuestionChange(index, 'bloomLevel', e.target.value)}
                      className="w-full text-sm p-2 border rounded"
                    >
                      <option>Remember</option>
                      <option>Understand</option>
                      <option>Apply</option>
                      <option>Analyze</option>
                      <option>Evaluate</option>
                      <option>Create</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Question Text</label>
                  <textarea
                    value={q.question}
                    onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                    className="w-full text-sm p-2 border rounded"
                    rows="2"
                  />
                </div>

                {q.type === 'MCQ' && (
                  <div className="bg-slate-50 p-3 rounded-lg space-y-2">
                    <label className="block text-xs font-medium text-slate-500">Options</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(q.options || ['', '', '', '']).map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name={`correct-${index}`}
                            checked={q.correctOption === opt && opt !== ''}
                            onChange={() => handleQuestionChange(index, 'correctOption', opt)}
                          />
                          <input
                            value={opt}
                            onChange={(e) => handleOptionChange(index, oIdx, e.target.value)}
                            className="flex-1 text-sm p-1.5 border rounded"
                            placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Model Answer / Rubric</label>
                  <textarea
                    value={q.modelAnswer}
                    onChange={(e) => handleQuestionChange(index, 'modelAnswer', e.target.value)}
                    className="w-full text-sm p-2 border rounded"
                    rows="2"
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
        
        <button
          onClick={addQuestion}
          className="w-full py-3 border-2 border-dashed border-primary-300 text-primary-600 rounded-lg hover:bg-primary-50 font-medium"
        >
          + Add New Question
        </button>
      </div>
    </Layout>
  );
}
