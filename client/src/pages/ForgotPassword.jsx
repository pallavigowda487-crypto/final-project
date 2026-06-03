import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { getApiErrorMessage } from '../utils/apiError';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setResetUrl('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(data.message);
      if (data.resetUrl) setResetUrl(data.resetUrl);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Password reset request failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-slate-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-primary-700">Reset Password</h1>
        <p className="text-center text-slate-500 mt-1 mb-6">Enter your account email</p>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
        {message && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{message}</div>
        )}
        {resetUrl && (
          <Link
            to={new URL(resetUrl).pathname}
            className="mb-4 block p-3 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium break-words hover:underline"
          >
            Open reset link
          </Link>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Get Reset Link'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Remembered it?{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
