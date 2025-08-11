import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './mobile-styles.css';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProviderMatching from './pages/provider-matching';
import VoiceIntake from './pages/VoiceIntake';
import Appointments from './pages/Appointments';
import Documents from './pages/Documents';
import Settings from './pages/Settings';
import PatientIntakeForm from './components/PatientIntakeForm';
import ErrorBoundary from './components/ErrorBoundary';
import MedicalChronology from './pages/MedicalChronology';
import MedicalChronology1 from './pages/MedicalChronology1';
import PatientInformation from './pages/PatientInformation';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: string;
}

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentUser = localStorage.getItem('currentUser');
  return currentUser ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    setIsAuthenticated(!!user);
  }, []);

  const addLog = (type: LogEntry['type'], message: string, details?: string) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString(),
      type,
      message,
      details
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/" replace /> : <Login />
          } />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout logs={logs} addLog={addLog} clearLogs={clearLogs}>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/patient-intake" element={
            <ProtectedRoute>
              <Layout logs={logs} addLog={addLog} clearLogs={clearLogs}>
                <PatientIntakeForm
                  familyMembers={[]}
                  insuranceProviders={[]}
                  mode="dashboard"
                  onSubmit={(data) => {
                    console.log('Form submitted:', data);
                  }}
                />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/referral-management" element={
            <ProtectedRoute>
              <Layout logs={logs} addLog={addLog} clearLogs={clearLogs}>
                <ProviderMatching addLog={addLog} />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/voice-intake" element={
            <ProtectedRoute>
              <Layout logs={logs} addLog={addLog} clearLogs={clearLogs}>
                <VoiceIntake addLog={addLog} />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/appointments" element={
            <ProtectedRoute>
              <Layout logs={logs} addLog={addLog} clearLogs={clearLogs}>
                <Appointments />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/documents" element={
            <ProtectedRoute>
              <Layout logs={logs} addLog={addLog} clearLogs={clearLogs}>
                <Documents />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <Layout logs={logs} addLog={addLog} clearLogs={clearLogs}>
                <Settings />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/medical-chronology" element={
            <ProtectedRoute>
              <Layout logs={logs} addLog={addLog} clearLogs={clearLogs}>
                <MedicalChronology />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/medical-chronology1" element={
            <ProtectedRoute>
              <Layout logs={logs} addLog={addLog} clearLogs={clearLogs}>
                <MedicalChronology1 />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/patient-information" element={
            <ProtectedRoute>
              <Layout logs={logs} addLog={addLog} clearLogs={clearLogs}>
                <PatientInformation />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Redirect to login if no route matches */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App; 