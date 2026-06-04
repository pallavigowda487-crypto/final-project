import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../services/api';

const VoiceTextarea = ({ value, onChange }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Your browser does not support speech recognition. Please use Google Chrome or Microsoft Edge.');
        return;
      }
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false; 
      
      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        if (transcript) {
          const currentVal = valueRef.current;
          const newVal = currentVal ? currentVal + ' ' + transcript.trim() : transcript.trim();
          onChange({ target: { value: newVal } });
        }
      };
      
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (e) => {
        console.error('Speech error:', e.error);
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="relative">
      <textarea
        className="w-full border rounded-lg p-3 min-h-[100px] pr-12 focus:ring-2 focus:ring-primary-500 outline-none"
        placeholder="Your answer... (Type or use the microphone)"
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        onClick={toggleListen}
        className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
          isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
        title={isListening ? 'Stop listening' : 'Start speaking'}
      >
        {isListening ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path></svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
        )}
      </button>
    </div>
  );
};

export default function TakeExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [results, setResults] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [tabViolations, setTabViolations] = useState(0);
  const answersRef = useRef(answers);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    api.get(`/student/exams/${id}`).then((r) => {
      setExam(r.data.exam);
      setResults(r.data.results);
    });
  }, [id]);

  useEffect(() => {
    if (!exam || exam.status === 'evaluated' || submitting) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabViolations((prev) => {
          const newViolations = prev + 1;
          if (newViolations >= 3) {
            alert('Maximum tab switch violations reached (3/3). Auto-submitting your exam.');
            submitExam(answersRef.current);
          } else {
            alert(`WARNING: Tab switching is strictly prohibited! Violation ${newViolations}/3.`);
          }
          return newViolations;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [exam, submitting]);

  const submitExam = async (currentAnswers) => {
    const answerList = Object.entries(currentAnswers)
      .filter(([_, answer]) => answer && answer.trim().length > 0)
      .map(([questionIndex, answer]) => ({
        questionIndex: parseInt(questionIndex, 10),
        answer,
      }));
    if (answerList.length === 0 && tabViolations < 3) return alert('Please answer at least one question');
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

  const handleSubmit = () => submitExam(answers);

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
      {tabViolations > 0 && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg border border-red-200 mb-6 font-medium">
          Warning: Tab switching violation recorded ({tabViolations}/3). Your exam will be automatically submitted if you switch tabs again!
        </div>
      )}
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
            <VoiceTextarea
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
