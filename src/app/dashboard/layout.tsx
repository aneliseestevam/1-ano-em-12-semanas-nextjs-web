import { AuthProvider } from '../../hooks/useAuth';
import DashboardNav from '../../components/dashboard/DashboardNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <DashboardNav />
        <div className="lg:ml-64">
          {children}
        </div>
      </div>
    </AuthProvider>
  );
}
