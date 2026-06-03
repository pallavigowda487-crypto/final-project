import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import FacultyDashboard from './pages/faculty/Dashboard';
import SyllabusUpload from './pages/faculty/SyllabusUpload';
import GeneratePaper from './pages/faculty/GeneratePaper';
import PapersList from './pages/faculty/PapersList';
import EditPaper from './pages/faculty/EditPaper';
import AssignExam from './pages/faculty/AssignExam';
import FacultyPerformance from './pages/faculty/Performance';
import StudentDashboard from './pages/student/Dashboard';
import StudentExams from './pages/student/Exams';
import TakeExam from './pages/student/TakeExam';
import StudentReports from './pages/student/Reports';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminUsage from './pages/admin/Usage';
import AdminLogs from './pages/admin/Logs';

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  const routes = { admin: '/admin', faculty: '/faculty', student: '/student' };
  return <Navigate to={routes[user.role] || '/login'} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/" element={<HomeRedirect />} />
      <Route
        path="/faculty"
        element={
          <ProtectedRoute roles={['faculty', 'admin']}>
            <FacultyDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/syllabus"
        element={
          <ProtectedRoute roles={['faculty', 'admin']}>
            <SyllabusUpload />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/generate"
        element={
          <ProtectedRoute roles={['faculty', 'admin']}>
            <GeneratePaper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/papers"
        element={
          <ProtectedRoute roles={['faculty', 'admin']}>
            <PapersList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/papers/:id/edit"
        element={
          <ProtectedRoute roles={['faculty', 'admin']}>
            <EditPaper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/assign"
        element={
          <ProtectedRoute roles={['faculty', 'admin']}>
            <AssignExam />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/performance"
        element={
          <ProtectedRoute roles={['faculty', 'admin']}>
            <FacultyPerformance />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student"
        element={
          <ProtectedRoute roles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/exams"
        element={
          <ProtectedRoute roles={['student']}>
            <StudentExams />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/exams/:id"
        element={
          <ProtectedRoute roles={['student']}>
            <TakeExam />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/reports"
        element={
          <ProtectedRoute roles={['student']}>
            <StudentReports />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/usage"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminUsage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/logs"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLogs />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
