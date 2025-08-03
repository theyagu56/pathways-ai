import React from 'react';

const Documents: React.FC = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Documents</h1>
        <button className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base">
          + Upload Document
        </button>
      </div>

      {/* Document Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <span className="text-xl sm:text-2xl">📋</span>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Medical Records</h3>
          </div>
          <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Lab results, test reports, and medical history</p>
          <div className="text-xs sm:text-sm text-gray-500">12 documents</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <span className="text-xl sm:text-2xl">💊</span>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Prescriptions</h3>
          </div>
          <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Medication prescriptions and dosage information</p>
          <div className="text-xs sm:text-sm text-gray-500">5 documents</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <span className="text-xl sm:text-2xl">🏥</span>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Referrals</h3>
          </div>
          <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Provider referrals and specialist recommendations</p>
          <div className="text-xs sm:text-sm text-gray-500">6 documents</div>
        </div>
      </div>

      {/* Recent Documents */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Documents</h2>
        </div>
        <div className="p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-gray-200 rounded-lg space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <span className="text-xl sm:text-2xl">📄</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">MRI Results - Right Ankle</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Radiology Report • Dec 10, 2024</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 self-start sm:self-auto">
                <button className="text-blue-600 hover:text-blue-800 text-sm">View</button>
                <button className="text-gray-600 hover:text-gray-800 text-sm">Download</button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-gray-200 rounded-lg space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <span className="text-xl sm:text-2xl">💊</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Pain Medication Prescription</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Prescription • Dec 8, 2024</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 self-start sm:self-auto">
                <button className="text-blue-600 hover:text-blue-800 text-sm">View</button>
                <button className="text-gray-600 hover:text-gray-800 text-sm">Download</button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-gray-200 rounded-lg space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <span className="text-xl sm:text-2xl">🏥</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Physical Therapy Referral</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Referral • Dec 5, 2024</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 self-start sm:self-auto">
                <button className="text-blue-600 hover:text-blue-800 text-sm">View</button>
                <button className="text-gray-600 hover:text-gray-800 text-sm">Download</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documents; 