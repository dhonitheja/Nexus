import type React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Overview from './pages/Overview';
import Logs from './pages/Logs';
import Metrics from './pages/Metrics';
import Security from './pages/Security';
import Settings from './pages/Settings';
import Login from './pages/Login';
import ServiceMap from './pages/ServiceMap';
import Tracing from './pages/Tracing';
import Insights from './pages/Insights';
import Search from './pages/Search';
import Remediation from './pages/Remediation';
import NexusCore from './components/NexusCore';

const Layout = () => (
  <div className="flex bg-bg min-h-screen text-text">
    <Sidebar />
    <main className="flex-1 ml-64 p-8 relative z-10">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none -z-10" />
      <Outlet />
      <NexusCore />
    </main>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = localStorage.getItem('user');
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          {/* ... */}
          <Route path="/" element={<Overview />} />
          <Route path="/search" element={<Search />} />
          <Route path="/remediation" element={<Remediation />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/metrics" element={<Metrics />} />
          <Route path="/service-map" element={<ServiceMap />} />
          <Route path="/tracing" element={<Tracing />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/security" element={<Security />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
