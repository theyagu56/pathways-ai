import React, { useState, useEffect } from 'react';

const Dashboard: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string>('');

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Professional Welcome Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 sm:p-8 border border-blue-100">
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <div className="text-center sm:text-left mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Welcome to Pathways Agent
            </h1>
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-200">
                  <img 
                    src="/Thiyagu.jpg" 
                    alt="Thiyagarajan Kamalakannan" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-semibold text-gray-900">
                    Thiyagarajan Kamalakannan
                  </p>
                  <p className="text-sm text-blue-600 font-medium">
                    Healthcare Administrator
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Online</span>
              </div>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-sm text-gray-600 mb-1">Last Login</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <p className="text-xs text-gray-500">
              {new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-base text-gray-700 text-center">
            Your comprehensive healthcare management platform for efficient patient care and medical document processing
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-1 sm:p-2 bg-blue-100 rounded-lg">
              <span className="text-lg sm:text-2xl">🏥</span>
            </div>
            <div className="ml-2 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Active Referrals</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-1 sm:p-2 bg-green-100 rounded-lg">
              <span className="text-lg sm:text-2xl">📅</span>
            </div>
            <div className="ml-2 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Upcoming Appointments</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">5</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-1 sm:p-2 bg-yellow-100 rounded-lg">
              <span className="text-lg sm:text-2xl">📄</span>
            </div>
            <div className="ml-2 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Documents</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">23</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-1 sm:p-2 bg-purple-100 rounded-lg">
              <span className="text-lg sm:text-2xl">👤</span>
            </div>
            <div className="ml-2 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Providers</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">8</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">New provider referral created</p>
                <p className="text-xs sm:text-sm text-gray-500">Dr. Sarah Johnson - Orthopedics</p>
              </div>
              <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0">2 hours ago</span>
            </div>
            
            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Appointment scheduled</p>
                <p className="text-xs sm:text-sm text-gray-500">Physical Therapy - Tomorrow 2:00 PM</p>
              </div>
              <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0">1 day ago</span>
            </div>
            
            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Document uploaded</p>
                <p className="text-xs sm:text-sm text-gray-500">MRI Results - Radiology Report</p>
              </div>
              <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0">3 days ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 