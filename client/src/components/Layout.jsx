import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = {
    faculty: [
      { to: '/faculty', label: 'Dashboard' },
      { to: '/faculty/syllabus', label: 'Syllabus' },
      { to: '/faculty/generate', label: 'Generate Paper' },
      { to: '/faculty/papers', label: 'Papers' },
      { to: '/faculty/assign', label: 'Assign Exam' },
      { to: '/faculty/performance', label: 'Performance' },
    ],
    student: [
      { to: '/student', label: 'Dashboard' },
      { to: '/student/exams', label: 'My Exams' },
      { to: '/student/reports', label: 'Reports' },
    ],
    admin: [
      { to: '/admin', label: 'Dashboard' },
      { to: '/admin/users', label: 'Users' },
      { to: '/admin/usage', label: 'API Usage' },
      { to: '/admin/logs', label: 'Audit Logs' },
    ],
  };

  const links = navLinks[user?.role] || [];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary-600">
            AI Exam Platform
          </Link>
          <nav className="hidden md:flex gap-4">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-sm text-slate-600 hover:text-primary-600 font-medium"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 capitalize">{user?.role}</span>
            <span className="text-sm font-medium">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {title && <h1 className="text-2xl font-bold mb-6">{title}</h1>}
        {children}
      </main>
    </div>
  );
}
