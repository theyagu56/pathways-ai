import React, { useState } from 'react';
import MedicalTimeline from '../components/MedicalTimeline';
import { getApiUrl } from '../config';

interface VisitDetail {
  date?: string;
  diagnosis?: string;
  cost?: number;
  imaging?: string;
  notes?: string;
}

interface MonthlyBillingSummary {
  year: number;
  month: number;
  total_cost: number;
  record_count: number;
}

interface OCRExtractionResult {
  visits: VisitDetail[];
  timeline: VisitDetail[];
  monthly_summary: MonthlyBillingSummary[];
  errors: string[];
}

const PatientInformation: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [patientName, setPatientName] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<{ [key: string]: OCRExtractionResult }>({});
  const [rawTexts, setRawTexts] = useState<{ [key: string]: string }>({});
  const [showRawText, setShowRawText] = useState(false);
  const [downloadIds, setDownloadIds] = useState<{ [key: string]: number | null }>({});
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [patients, setPatients] = useState<Array<{name: string, folder_name: string, file_count: number}>>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      setResults({});
      setRawTexts({});
      setDownloadIds({});
      setUploadProgress({});
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    
    // Remove associated results
    const removedFile = files[index];
    if (removedFile) {
      const fileName = removedFile.name;
      const newResults = { ...results };
      const newRawTexts = { ...rawTexts };
      const newDownloadIds = { ...downloadIds };
      const newUploadProgress = { ...uploadProgress };
      
      delete newResults[fileName];
      delete newRawTexts[fileName];
      delete newDownloadIds[fileName];
      delete newUploadProgress[fileName];
      
      setResults(newResults);
      setRawTexts(newRawTexts);
      setDownloadIds(newDownloadIds);
      setUploadProgress(newUploadProgress);
    }
  };

  const handleUpload = async () => {
    console.log('🚀 Starting upload process...');
    console.log('📁 Files to upload:', files.map(f => f.name));
    console.log('👤 Patient name:', patientName);
    
    if (files.length === 0) {
      alert('Please select files first');
      return;
    }

    if (!patientName.trim()) {
      alert('Please enter a patient name');
      return;
    }

    setIsUploading(true);
    setUploadProgress({});

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = file.name;
      
      // Update progress to show upload starting
      setUploadProgress(prev => ({ ...prev, [fileName]: 10 }));
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patient_name', patientName);

      try {
        console.log(`📤 Uploading ${fileName}...`);
        
        // Update progress to show upload in progress
        setUploadProgress(prev => ({ ...prev, [fileName]: 50 }));
        
        const response = await fetch(getApiUrl('/upload/'), {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log(`✅ ${fileName} uploaded successfully:`, result);
        
        setResults(prev => ({ ...prev, [fileName]: result }));
        setRawTexts(prev => ({ ...prev, [fileName]: result.raw_text || '' }));
        setDownloadIds(prev => ({ ...prev, [fileName]: result.id }));
        
        // Update progress to 100%
        setUploadProgress(prev => ({ ...prev, [fileName]: 100 }));
        
      } catch (error) {
        console.error(`❌ Error uploading ${fileName}:`, error);
        setResults(prev => ({ 
          ...prev, 
          [fileName]: { 
            visits: [], 
            timeline: [], 
            monthly_summary: [], 
            errors: [error instanceof Error ? error.message : 'Upload failed'] 
          } 
        }));
        setUploadProgress(prev => ({ ...prev, [fileName]: -1 })); // -1 indicates error
      }
    }

    setIsUploading(false);
    console.log('🎉 Upload process completed!');
  };

  const handleDownload = async (fileName: string) => {
    const resultId = downloadIds[fileName];
    if (!resultId) {
      alert('No result available for download');
      return;
    }

    try {
              const response = await fetch(getApiUrl(`/download/${resultId}`));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `patient_information_${resultId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed');
    }
  };

  const testExtraction = async () => {
    console.log('🧪 Testing extraction...');
    
    const testData = {
      visits: [
        { date: '2024-01-15', diagnosis: 'Hypertension', cost: 150, notes: 'Initial consultation' },
        { date: '2024-02-20', diagnosis: 'Diabetes Type 2', cost: 200, notes: 'Follow-up visit' }
      ],
      timeline: [
        { date: '2024-01-15', diagnosis: 'Hypertension', cost: 150 },
        { date: '2024-02-20', diagnosis: 'Diabetes Type 2', cost: 200 }
      ],
      monthly_summary: [
        { year: 2024, month: 1, total_cost: 150, record_count: 1 },
        { year: 2024, month: 2, total_cost: 200, record_count: 1 }
      ],
      errors: []
    };

    setResults({ 'test-file.pdf': testData });
    console.log('✅ Test data loaded');
  };

  const showSampleData = () => {
    const sampleData = {
      visits: [
        {
          date: '2024-01-15',
          diagnosis: 'Hypertension',
          cost: 150,
          imaging: 'None',
          notes: 'Initial consultation for blood pressure management'
        },
        {
          date: '2024-02-20',
          diagnosis: 'Diabetes Type 2',
          cost: 200,
          imaging: 'None',
          notes: 'Follow-up visit, blood sugar monitoring'
        },
        {
          date: '2024-03-10',
          diagnosis: 'Chest Pain',
          cost: 350,
          imaging: 'Chest X-Ray',
          notes: 'Emergency visit, ruled out cardiac issues'
        }
      ],
      timeline: [
        {
          date: '2024-01-15',
          diagnosis: 'Hypertension',
          cost: 150,
          notes: 'Initial diagnosis'
        },
        {
          date: '2024-02-20',
          diagnosis: 'Diabetes Type 2',
          cost: 200,
          notes: 'Additional diagnosis'
        },
        {
          date: '2024-03-10',
          diagnosis: 'Chest Pain',
          cost: 350,
          notes: 'Emergency evaluation'
        }
      ],
      monthly_summary: [
        {
          year: 2024,
          month: 1,
          total_cost: 150,
          record_count: 1
        },
        {
          year: 2024,
          month: 2,
          total_cost: 200,
          record_count: 1
        },
        {
          year: 2024,
          month: 3,
          total_cost: 350,
          record_count: 1
        }
      ],
      errors: []
    };

    setResults({ 'sample-data.pdf': sampleData });
    setRawTexts({ 'sample-data.pdf': 'Sample patient information extracted from medical documents...' });
  };

  const loadPatients = async () => {
    try {
      const response = await fetch(getApiUrl('/patients/'));
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (error) {
      console.error('Failed to load patients:', error);
    }
  };

  const loadPatientFiles = async (patientName: string) => {
    try {
      const response = await fetch(getApiUrl(`/patient-files/${patientName}`));
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Failed to load patient files:', error);
    }
  };

  const clearForm = () => {
    setFiles([]);
    setPatientName('');
    setResults({});
    setRawTexts({});
    setDownloadIds({});
    setUploadProgress({});
    setSelectedPatient('');
  };

  const clearPatientName = () => {
    setPatientName('');
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const convertToTimelineEvents = (visits: VisitDetail[], filename: string = 'Uploaded Document') => {
    return visits.map((visit, index) => ({
      date: visit.date || 'Unknown Date',
      type: 'Visit',
      description: visit.notes || `Cost: ${formatCurrency(visit.cost || 0)}`,
      source: filename,
      amount: visit.cost
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Information</h1>
          <p className="text-gray-600">Upload and manage patient medical documents and information</p>
        </div>

        {/* Status Display */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Status: Files={files.length} | Uploading={isUploading ? 'Yes' : 'No'} | Patient={patientName || 'Not Set'}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={testExtraction}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
              >
                Test Data
              </button>
              <button
                onClick={showSampleData}
                className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
              >
                Sample Data
              </button>
              <button
                onClick={clearForm}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload Form */}
          <div className="space-y-6">
            {/* Patient Name Input */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-2">
                    Patient Name *
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      id="patientName"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter patient name"
                    />
                    <button
                      onClick={clearPatientName}
                      className="px-3 py-2 bg-gray-100 text-gray-600 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Documents</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="fileInput" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Medical Documents
                  </label>
                  <input
                    type="file"
                    id="fileInput"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700">Selected Files:</h3>
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600 truncate">{file.name}</span>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button */}
                <button
                  onClick={handleUpload}
                  disabled={files.length === 0 || isUploading || !patientName.trim()}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isUploading ? 'Uploading...' : 'Upload & Extract'}
                </button>
              </div>
            </div>

            {/* Patient List */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Existing Patients</h2>
                <button
                  onClick={loadPatients}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                >
                  Refresh
                </button>
              </div>
              <div className="space-y-2">
                {patients.map((patient, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      setSelectedPatient(patient.name);
                      loadPatientFiles(patient.name);
                    }}
                  >
                    <span className="text-sm text-gray-700">{patient.name}</span>
                    <span className="text-xs text-gray-500">{patient.file_count} files</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {/* Upload Progress */}
            {Object.keys(uploadProgress).length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Progress</h2>
                <div className="space-y-3">
                  {Object.entries(uploadProgress).map(([fileName, progress]) => (
                    <div key={fileName}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{fileName}</span>
                        <span className="text-gray-600">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            progress === -1 ? 'bg-red-500' : progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${progress === -1 ? 100 : progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            {Object.keys(results).length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Extraction Results</h2>
                <div className="space-y-4">
                  {Object.entries(results).map(([fileName, result]) => (
                    <div key={fileName} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">{fileName}</h3>
                        <div className="flex space-x-2">
                          {downloadIds[fileName] && (
                            <button
                              onClick={() => handleDownload(fileName)}
                              className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                            >
                              Download CSV
                            </button>
                          )}
                          <button
                            onClick={() => setShowRawText(!showRawText)}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                          >
                            {showRawText ? 'Hide' : 'Show'} Raw Text
                          </button>
                        </div>
                      </div>

                      {/* Raw Text */}
                      {showRawText && rawTexts[fileName] && (
                        <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
                          <pre className="whitespace-pre-wrap text-gray-700">{rawTexts[fileName]}</pre>
                        </div>
                      )}

                      {/* Errors */}
                      {result.errors && result.errors.length > 0 && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                          <h4 className="font-medium text-red-800 mb-2">Errors:</h4>
                          <ul className="text-sm text-red-700 space-y-1">
                            {result.errors.map((error, index) => (
                              <li key={index}>• {error}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Visits */}
                      {result.visits && result.visits.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Medical Visits ({result.visits.length})</h4>
                          <div className="space-y-2">
                            {result.visits.map((visit, index) => (
                              <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                                <div className="flex justify-between">
                                  <span className="font-medium">{visit.date ? formatDate(visit.date) : 'Unknown Date'}</span>
                                  <span className="text-gray-600">{visit.cost ? formatCurrency(visit.cost) : 'N/A'}</span>
                                </div>
                                <div className="text-gray-700">{visit.diagnosis || 'No diagnosis'}</div>
                                {visit.notes && <div className="text-gray-600 text-xs">{visit.notes}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Monthly Summary */}
                      {result.monthly_summary && result.monthly_summary.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Monthly Summary</h4>
                          <div className="space-y-1">
                            {result.monthly_summary.map((summary, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{summary.year}-{summary.month.toString().padStart(2, '0')}</span>
                                <span>{formatCurrency(summary.total_cost)} ({summary.record_count} records)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            {Object.keys(results).length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Medical Timeline</h2>
                <MedicalTimeline
                  events={Object.entries(results).flatMap(([fileName, result]) =>
                    convertToTimelineEvents(result.timeline || [], fileName)
                  )}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientInformation; 