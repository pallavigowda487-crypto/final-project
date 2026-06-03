import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../services/api';

export default function SyllabusUpload() {
  const [subject, setSubject] = useState('');
  const [files, setFiles] = useState([]);
  const [syllabi, setSyllabi] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const load = () => api.get('/faculty/syllabus').then((r) => setSyllabi(r.data.syllabi || []));
  useEffect(() => {
    load();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!files || files.length === 0 || !subject) return;
    setLoading(true);
    setMessage('');
    const form = new FormData();
    for (let i = 0; i < files.length; i++) {
      form.append('files', files[i]);
    }
    form.append('subject', subject);
    try {
      await api.post('/faculty/syllabus/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage('Syllabus uploaded and indexed successfully!');
      setSubject('');
      setFiles([]);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const statusClass = (status) => {
    if (status === 'ready') return 'bg-green-100 text-green-700';
    if (status === 'failed') return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  return (
    <Layout title="Upload Syllabus">
      <Card className="max-w-lg mb-8">
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="e.g. Data Structures"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">PDF or DOCX (max 20MB)</label>
            <input
              type="file"
              accept=".pdf,.docx"
              multiple
              onChange={(e) => setFiles(e.target.files)}
              className="w-full"
              required
            />
            {files.length > 0 && <p className="text-xs text-slate-500 mt-1">{files.length} file(s) selected</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Upload & Index'}
          </button>
          {message && <p className="text-sm text-slate-600">{message}</p>}
        </form>
      </Card>
      <Card>
        <h2 className="font-semibold mb-4">Uploaded Syllabi</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2">Subject</th>
                <th>File</th>
                <th>Chunks</th>
                <th>Pinecone</th>
                <th>Namespace</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {syllabi.map((s) => (
                <tr key={s._id} className="border-b">
                  <td className="py-2">{s.subject}</td>
                  <td>{s.fileName}</td>
                  <td>{s.chunkCount}</td>
                  <td>
                    {s.pineconeVerifiedAt
                      ? `${s.pineconeVectorCount || 0} vectors`
                      : s.status === 'ready'
                        ? 'Not verified'
                        : '-'}
                  </td>
                  <td className="font-mono text-xs text-slate-500">{s.pineconeNamespace}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded text-xs ${statusClass(s.status)}`}>
                      {s.status}
                    </span>
                  </td>
                  <td>{new Date(s.uploadDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Layout>
  );
}
