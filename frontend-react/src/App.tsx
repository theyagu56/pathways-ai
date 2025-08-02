import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
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

function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

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
        <Layout logs={logs} addLog={addLog} clearLogs={clearLogs}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patient-intake" element={
              <PatientIntakeForm
                familyMembers={[]}
                insuranceProviders={[]}
                mode="dashboard"
                onSubmit={(data) => {
                  console.log('Form submitted:', data);
                }}
              />
            } />
            <Route path="/referral-management" element={<ProviderMatching addLog={addLog} />} />
            <Route path="/voice-intake" element={<VoiceIntake addLog={addLog} />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/medical-chronology" element={<MedicalChronology />} />
            <Route path="/medical-chronology1" element={<MedicalChronology1 />} />
            <Route path="/patient-information" element={<PatientInformation />} />
          </Routes>
        </Layout>
      </Router>
    </ErrorBoundary>
  );
}

export default App; 