import { useAuth } from '../../context/AuthContext';
import StudentDashboard from './StudentDashboard';
import AdminDashboard from './AdminDashboard';
import WardenDashboard from './WardenDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  if (user?.role === 'admin') return <AdminDashboard />;
  if (user?.role === 'warden') return <WardenDashboard />;
  return <StudentDashboard />;
}
