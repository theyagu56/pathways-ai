import React from 'react';

const Appointments: React.FC = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Appointments</h1>
        <button className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base">
          + New Appointment
        </button>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Upcoming Appointments</h2>
        </div>
        <div className="p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Physical Therapy Session</h3>
                  <p className="text-gray-600 text-sm">Dr. Michael Chen - Physical Therapist</p>
                  <p className="text-xs sm:text-sm text-gray-500">Tomorrow, 2:00 PM - 3:00 PM</p>
                </div>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full self-start">
                  Confirmed
                </span>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Follow-up Consultation</h3>
                  <p className="text-gray-600 text-sm">Dr. Sarah Johnson - Orthopedics</p>
                  <p className="text-xs sm:text-sm text-gray-500">Dec 15, 2024, 10:00 AM - 10:30 AM</p>
                </div>
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full self-start">
                  Pending
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Past Appointments */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Past Appointments</h2>
        </div>
        <div className="p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="border border-gray-200 rounded-lg p-3 sm:p-4 opacity-75">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Initial Consultation</h3>
                  <p className="text-gray-600 text-sm">Dr. Sarah Johnson - Orthopedics</p>
                  <p className="text-xs sm:text-sm text-gray-500">Dec 1, 2024, 9:00 AM - 9:30 AM</p>
                </div>
                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full self-start">
                  Completed
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appointments; 