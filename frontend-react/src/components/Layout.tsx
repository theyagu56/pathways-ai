import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: string;
}

interface LayoutProps {
  children: React.ReactNode;
  logs: LogEntry[];
  addLog: (type: LogEntry['type'], message: string, details?: string) => void;
  clearLogs: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, logs, addLog, clearLogs }) => {
  const [showEvents, setShowEvents] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false); // <-- NEW
  const location = useLocation();

  // Navigation menu items
  const menuItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: '📊',
      path: '/',
      description: 'Main dashboard'
    },
    
    {
      id: 'patient-intake',
      name: 'Intake',
      icon: '👤',
      path: '/patient-intake',
      description: 'Patient information and intake form'
    },
    
    {
      id: 'patient-information',
      name: 'Patient Information',
      icon: '📋',
      path: '/patient-information',
      description: 'Upload and manage patient medical documents'
    },
    
    {
      id: 'voice-intake',
      name: 'Case Notes',
      icon: '🎤',
      path: '/voice-intake',
      description: 'Voice-enabled healthcare triage'
    },
    /*{
      id: 'referral-management',
      name: 'Triage & Referral',
      icon: '🏥',
      path: '/referral-management',
      description: 'Provider matching and referrals'
    },*/
    {
      id: 'appointments',
      name: 'Appointments',
      icon: '📅',
      path: '/appointments',
      description: 'Schedule and manage appointments'
    },
    {
      id: 'documents',
      name: 'Documents',
      icon: '📄',
      path: '/documents',
      description: 'Manage documents'
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: '⚙️',
      path: '/settings',
      description: 'Application settings'
    },
    /*{
      id: 'medical-chronology',
      name: 'Medical Chronology',
      icon: '📜',
      path: '/medical-chronology',
      description: 'View medical chronology'
    },*/
    {
      id: 'medical-chronology1',
      name: 'Medical Chronology',
      icon: '🔍',
      path: '/medical-chronology1',
      description: 'Medical chronology with Google Vision API'
    }
  ];

  // Get log icon based on type
  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'info':
        return 'ℹ️';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'success':
        return '✅';
      default:
        return '📝';
    }
  };

  // Get log color based on type
  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'info':
        return 'text-blue-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      case 'success':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };



  const EventIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 11H5M19 11a7 7 0 0 1-7-7V3M12 12V3M3 11a7 7 0 0 1 7-7v14a7 7 0 0 1-7-7" />
    </svg>
  );

  const ProfileIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
    </svg>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-x-hidden">
      {/* Mobile Hamburger Button */}
      <button
        className="fixed top-2 left-2 z-30 md:hidden flex flex-col justify-center items-center w-8 h-8 bg-white rounded shadow-lg focus:outline-none"
        onClick={() => setShowSidebar(true)}
        aria-label="Open menu"
        type="button"
      >
        <span className="block w-5 h-0.5 bg-gray-800 mb-1"></span>
        <span className="block w-5 h-0.5 bg-gray-800 mb-1"></span>
        <span className="block w-5 h-0.5 bg-gray-800"></span>
      </button>

      {/* Sidebar (Desktop) */}
      <div className="w-64 bg-white shadow-lg hidden md:block h-full">
        {/* Logo/Brand */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col items-center">
            <img 
              src="/PathwaysAILogo.png" 
              alt="Pathways AI Logo" 
              className="h-32 w-auto max-w-full"
              style={{ minHeight: '128px', objectFit: 'contain' }}
            />
          </div>
        </div>
        {/* Navigation Menu */}
        <nav className="mt-4">
          <div className="px-2 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                  location.pathname === item.path
                    ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={item.description}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Sidebar Drawer (Mobile) */}
      {showSidebar && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-20 md:hidden"
            onClick={() => setShowSidebar(false)}
          ></div>
          {/* Drawer */}
          <div className="fixed top-0 left-0 w-64 h-full bg-white shadow-lg z-30 md:hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex flex-col items-center">
                <img 
                  src="/PathwaysAILogo.png" 
                  alt="Pathways AI Logo" 
                  className="h-32 w-auto max-w-full"
                  style={{ minHeight: '128px', objectFit: 'contain' }}
                />
              </div>
              <button
                className="ml-2 text-gray-600 hover:text-gray-900 focus:outline-none"
                onClick={() => setShowSidebar(false)}
                aria-label="Close menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="mt-4 flex-1 overflow-y-auto">
              <div className="px-2 space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                      location.pathname === item.path
                        ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    title={item.description}
                    onClick={() => setShowSidebar(false)} // auto-close on click
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Main page content */}
        <main className="flex-1 overflow-y-auto px-2 sm:px-4 md:px-8 py-2 sm:py-4 md:py-8" style={{ paddingLeft: '3.5rem' }}>
          {children}
        </main>
      </div>

      {/* Events Modal */}
      {showEvents && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Events Log</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={clearLogs}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowEvents(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {logs.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <span className="text-4xl mb-4 block">📝</span>
                  <p>No events logged yet.</p>
                  <p className="text-sm">Events will appear here when you interact with the application.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <span className="text-lg">{getLogIcon(log.type)}</span>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className={getLogColor(log.type)}>
                                {log.message}
                              </span>
                              <span className="text-xs text-gray-500">
                                {log.timestamp}
                              </span>
                            </div>
                            {log.details && (
                              <p className="text-sm text-gray-600 mt-1">
                                {log.details}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;