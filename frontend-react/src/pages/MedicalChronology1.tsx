import React, { useState } from 'react';
import MedicalTimeline from '../components/MedicalTimeline';

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

const MedicalChronology1: React.FC = () => {
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
      
      // Update progress
      setUploadProgress(prev => ({ ...prev, [fileName]: 0 }));
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patient_name', patientName.trim());

      try {
        console.log(`📤 Uploading file: ${fileName} for patient: ${patientName}`);
        setUploadProgress(prev => ({ ...prev, [fileName]: 25 }));
        
        const response = await fetch('http://localhost:8000/google-ocr/upload', {
          method: 'POST',
          body: formData,
        });

        console.log(`📥 Response status for ${fileName}:`, response.status);
        setUploadProgress(prev => ({ ...prev, [fileName]: 75 }));

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Upload successful for ${fileName}:`, data);
          setResults(prev => ({ ...prev, [fileName]: data }));
          setRawTexts(prev => ({ ...prev, [fileName]: data.raw_text || '' }));
          setDownloadIds(prev => ({ ...prev, [fileName]: data.id || null }));
          setUploadProgress(prev => ({ ...prev, [fileName]: 100 }));
        } else {
          const errorData = await response.json();
          console.error(`❌ Upload failed for ${fileName}:`, errorData);
          alert(`Upload failed for ${fileName}: ${errorData.detail || 'Unknown error'}`);
          setUploadProgress(prev => ({ ...prev, [fileName]: -1 })); // Error state
        }
      } catch (error) {
        console.error(`💥 Upload error for ${fileName}:`, error);
        alert(`Upload failed for ${fileName}. Please try again.`);
        setUploadProgress(prev => ({ ...prev, [fileName]: -1 })); // Error state
      }
    }
    
    console.log('🏁 Upload process completed');
    setIsUploading(false);
    // Refresh patient list after upload
    loadPatients();
    
    // Clear files and progress, but keep patient name for convenience
    setFiles([]);
    setUploadProgress({});
    
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleDownload = async (fileName: string) => {
    const downloadId = downloadIds[fileName];
    if (!downloadId) {
      alert('No result available for download');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/google-ocr/download/${downloadId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `medical_chronology_${fileName}_${downloadId}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed');
    }
  };

  const testExtraction = async () => {
    setIsUploading(true);
    try {
      const response = await fetch('http://localhost:8000/google-ocr/test-extraction', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        // Store test result with a special key
        setResults(prev => ({ ...prev, 'test-data': data }));
        setRawTexts(prev => ({ ...prev, 'test-data': data.raw_text || '' }));
      } else {
        const errorData = await response.json();
        alert(`Test failed: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Test error:', error);
      alert('Test failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const showSampleData = () => {
    // Create sample fallback data
    const sampleData: OCRExtractionResult = {
      visits: [
        {
          date: '2024-12-15',
          diagnosis: 'Annual physical examination',
          cost: 150,
          imaging: 'None',
          notes: 'Patient in good health, recommended follow-up in 1 year'
        },
        {
          date: '2024-11-28',
          diagnosis: 'Seasonal allergies',
          cost: 75,
          imaging: 'None',
          notes: 'Prescribed antihistamine medication'
        },
        {
          date: '2024-11-15',
          diagnosis: 'Respiratory symptoms',
          cost: 200,
          imaging: 'Chest X-ray',
          notes: 'X-ray showed clear lung fields, no abnormalities detected'
        }
      ],
      timeline: [
        {
          date: '2024-12-15',
          diagnosis: 'Annual physical examination',
          cost: 150,
          imaging: 'None',
          notes: 'Patient in good health, recommended follow-up in 1 year'
        },
        {
          date: '2024-11-28',
          diagnosis: 'Seasonal allergies',
          cost: 75,
          imaging: 'None',
          notes: 'Prescribed antihistamine medication'
        },
        {
          date: '2024-11-15',
          diagnosis: 'Respiratory symptoms',
          cost: 200,
          imaging: 'Chest X-ray',
          notes: 'X-ray showed clear lung fields, no abnormalities detected'
        },
        {
          date: '2024-10-20',
          diagnosis: 'Blood work and lab tests',
          cost: 120,
          imaging: 'None',
          notes: 'All results within normal range'
        },
        {
          date: '2024-09-05',
          diagnosis: 'Emergency room visit',
          cost: 450,
          imaging: 'None',
          notes: 'Minor injury treated, patient discharged in stable condition'
        }
      ],
      monthly_summary: [
        {
          year: 2024,
          month: 12,
          total_cost: 150,
          record_count: 1
        },
        {
          year: 2024,
          month: 11,
          total_cost: 275,
          record_count: 2
        },
        {
          year: 2024,
          month: 10,
          total_cost: 120,
          record_count: 1
        },
        {
          year: 2024,
          month: 9,
          total_cost: 450,
          record_count: 1
        }
      ],
      errors: []
    };

    const sampleRawText = `Sample Medical Document OCR Text

PATIENT: John Doe
DOB: 01/15/1980
MRN: 123456789

MEDICAL HISTORY:
- Annual physical examination completed on 12/15/2024
- Patient reported feeling generally well
- Blood pressure: 120/80 mmHg
- Heart rate: 72 bpm
- Temperature: 98.6°F

DIAGNOSIS:
- No significant health issues identified
- Recommended maintaining current exercise routine
- Follow-up scheduled for next year

BILLING:
- Office visit: $150.00
- Insurance coverage applied
- Patient responsibility: $25.00

This is a sample OCR text that would be extracted from a medical document using Google Cloud Vision API or fallback to mock service when the API is not available.`;

    // Store sample data
    setResults(prev => ({ ...prev, 'sample-data': sampleData }));
    setRawTexts(prev => ({ ...prev, 'sample-data': sampleRawText }));
    setDownloadIds(prev => ({ ...prev, 'sample-data': 999 })); // Sample download ID
  };

  const loadPatients = async () => {
    console.log('👥 Loading patients...');
    try {
      const response = await fetch('http://localhost:8000/google-ocr/patients');
      console.log('📊 Patients response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('👥 Patients loaded:', data);
        setPatients(data.patients || []);
      } else {
        console.error('❌ Failed to load patients, status:', response.status);
      }
    } catch (error) {
      console.error('💥 Failed to load patients:', error);
    }
  };

  const loadPatientFiles = async (patientName: string) => {
    try {
      const response = await fetch(`http://localhost:8000/google-ocr/patient-files/${encodeURIComponent(patientName)}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`Files for ${patientName}:`, data);
        // You can display patient files here if needed
      }
    } catch (error) {
      console.error('Failed to load patient files:', error);
    }
  };

  // Load patients on component mount
  React.useEffect(() => {
    loadPatients();
  }, []);

  const clearForm = () => {
    setFiles([]);
    setPatientName('');
    setUploadProgress({});
    setResults({});
    setRawTexts({});
    setDownloadIds({});
    
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    
    console.log('🧹 Form cleared');
  };

  const clearPatientName = () => {
    setPatientName('');
    console.log('👤 Patient name cleared');
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Convert visit data to MedicalTimeline format
  const convertToTimelineEvents = (visits: VisitDetail[], filename: string = 'Uploaded Document') => {
    return visits.map((visit, index) => ({
      date: visit.date || new Date().toISOString().split('T')[0],
      type: visit.diagnosis ? 'Diagnosis' : visit.imaging ? 'Imaging' : visit.cost ? 'Billing' : 'Visit',
      description: visit.notes || visit.diagnosis || visit.imaging || 'Medical visit',
      source: filename,
      amount: visit.cost
    }));
  };

  // Demo data for testing the timeline component
  const demoEvents = [
    {
      date: '2024-12-15',
      type: 'Visit',
      description: 'Annual physical examination with Dr. Smith',
      source: 'Medical Records.pdf',
      amount: 150
    },
    {
      date: '2024-11-28',
      type: 'Diagnosis',
      description: 'Diagnosed with seasonal allergies',
      source: 'Allergy Test Results.pdf',
      amount: 75
    },
    {
      date: '2024-11-15',
      type: 'Imaging',
      description: 'Chest X-ray for respiratory symptoms',
      source: 'Radiology Report.pdf',
      amount: 200
    },
    {
      date: '2024-10-20',
      type: 'Procedure',
      description: 'Blood work and lab tests',
      source: 'Lab Results.pdf',
      amount: 120
    },
    {
      date: '2024-09-05',
      type: 'Billing',
      description: 'Emergency room visit for minor injury',
      source: 'ER Bill.pdf',
      amount: 450
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Medical Chronology
          </h1>
          
          {/* File Upload Section */}
          <div className="mb-8 p-6 bg-blue-50 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Medical Documents</h2>
            
            {/* Patient Name Input */}
            <div className="mb-4">
              <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-2">
                Patient Name *
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  id="patientName"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter patient name (e.g., John Doe)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {patientName && (
                  <button
                    onClick={clearPatientName}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                    title="Clear patient name"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* File Selection */}
            <div className="flex items-center space-x-4">
              <input
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <button
                onClick={handleUpload}
                disabled={files.length === 0 || isUploading || !patientName.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title={`Files: ${files.length}, Uploading: ${isUploading}, Patient: ${patientName.trim() ? 'Set' : 'Not Set'}`}
              >
                {isUploading ? 'Processing...' : 'Upload & Extract'}
              </button>
              {/* Debug info */}
              <div className="text-xs text-gray-500 mt-1">
                Status: Files={files.length} | Uploading={isUploading ? 'Yes' : 'No'} | Patient={patientName.trim() ? 'Set' : 'Not Set'}
              </div>
              <button
                onClick={testExtraction}
                disabled={isUploading}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Test Extraction
              </button>
              <button
                onClick={showSampleData}
                disabled={isUploading}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Sample
              </button>
              <button
                onClick={clearForm}
                disabled={isUploading}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Clear Form
              </button>
            </div>
            
            {/* Selected Files List */}
            {files.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Selected Files ({files.length}):</h3>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <span className="text-blue-600">📄</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {uploadProgress[file.name] !== undefined && (
                          <div className="flex items-center space-x-2">
                            {uploadProgress[file.name] === -1 ? (
                              <span className="text-red-500 text-xs">❌ Failed</span>
                            ) : uploadProgress[file.name] === 100 ? (
                              <span className="text-green-500 text-xs">✅ Complete</span>
                            ) : (
                              <div className="flex items-center space-x-1">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress[file.name]}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-500">{uploadProgress[file.name]}%</span>
                              </div>
                            )}
                          </div>
                        )}
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Patient Management Section */}
          {patients.length > 0 && (
            <div className="mb-8 p-6 bg-green-50 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Patient Files</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {patients.map((patient) => (
                  <div key={patient.folder_name} className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{patient.name}</h3>
                      <span className="text-sm text-gray-500">{patient.file_count} files</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Folder: {patient.folder_name}</p>
                    <button
                      onClick={() => loadPatientFiles(patient.name)}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      View Files
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results Section */}
          {Object.keys(results).length > 0 && (
            <div className="space-y-8">
              {/* Combined Medical Timeline */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Combined Medical Timeline</h3>
                <MedicalTimeline 
                  events={Object.entries(results).flatMap(([fileName, result]) => 
                    convertToTimelineEvents(result.timeline, fileName)
                  )}
                />
              </div>

              {/* Individual File Results */}
              {Object.entries(results).map(([fileName, result]) => (
                <div key={fileName} className="bg-white border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{fileName}</h3>
                    <button
                      onClick={() => handleDownload(fileName)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      Download CSV
                    </button>
                  </div>

                  {/* Monthly Billing Summary */}
                  {result.monthly_summary.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Monthly Billing Summary</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visit Count</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {result.monthly_summary.map((summary: any, index: number) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {`${summary.year}-${summary.month.toString().padStart(2, '0')}`}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatCurrency(summary.total_cost)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {summary.record_count}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Raw OCR Text */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-medium text-gray-900">Raw OCR Text</h4>
                      <button
                        onClick={() => setShowRawText(!showRawText)}
                        className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                      >
                        {showRawText ? 'Hide' : 'Show'} Raw Text
                      </button>
                    </div>
                    {showRawText && (
                      <div className="bg-gray-100 p-4 rounded-md">
                        <pre className="text-sm text-gray-800 whitespace-pre-wrap">{rawTexts[fileName]}</pre>
                      </div>
                    )}
                  </div>

                  {/* Errors */}
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="text-md font-medium text-red-900 mb-2">Errors</h4>
                      <ul className="list-disc list-inside text-red-700 text-sm">
                        {result.errors.map((error: string, index: number) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Demo Timeline Section (when no results) */}
          {Object.keys(results).length === 0 && (
            <div className="space-y-8">
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Demo Medical Timeline</h3>
                <p className="text-gray-600 mb-4">This is a preview of how your medical timeline will look after uploading documents.</p>
                <MedicalTimeline events={demoEvents} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalChronology1; 