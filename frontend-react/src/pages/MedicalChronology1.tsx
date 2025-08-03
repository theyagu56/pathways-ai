import React, { useState, useEffect } from 'react';
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

const MedicalChronology1: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [patientName, setPatientName] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<{ [key: string]: OCRExtractionResult }>({});
  const [rawTexts, setRawTexts] = useState<{ [key: string]: string }>({});
  const [showRawText, setShowRawText] = useState(false);
  const [downloadIds, setDownloadIds] = useState<{ [key: string]: number | null }>({});
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [patients, setPatients] = useState<Array<{patient_id: string, name: string, folder_name: string, file_count: number}>>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [currentPatientId, setCurrentPatientId] = useState<string>('');
  const [isUploadPanelExpanded, setIsUploadPanelExpanded] = useState(true);
  const [isPatientSearchExpanded, setIsPatientSearchExpanded] = useState(false);
  const [isDemoTimelineExpanded, setIsDemoTimelineExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  // Load patients automatically when component mounts
  useEffect(() => {
    loadPatients();
  }, []);

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('#patientSearch') && !target.closest('.autocomplete-dropdown')) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter patients based on search query
  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    
    if (files.length === 0) {
      alert('Please select files first');
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

      try {
        console.log(`📤 Uploading file: ${fileName}`);
        setUploadProgress(prev => ({ ...prev, [fileName]: 25 }));
        
        const response = await fetch(getApiUrl('/google-ocr/upload'), {
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
              const response = await fetch(getApiUrl(`/google-ocr/download/${downloadId}`));
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
      const response = await fetch(getApiUrl('/google-ocr/test-extraction'), {
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
    // Set mock patient information
    setSelectedPatient('John Doe');
    setPatientName('John Doe');
    setCurrentPatientId('PAT_SAMPLE123');
    
    // Create comprehensive sample data with multiple documents
    const sampleResults = {
      'Medical_Records_2024.pdf': {
        visits: [
          {
            date: '2024-12-15',
            diagnosis: 'S13.0',
            cost: 150,
            imaging: 'None',
            notes: 'Annual physical examination - Patient in good health, recommended follow-up in 1 year'
          },
          {
            date: '2024-11-28',
            diagnosis: 'J30.9',
            cost: 75,
            imaging: 'None',
            notes: 'Seasonal allergies - Prescribed antihistamine medication'
          }
        ],
        timeline: [
          {
            date: '2024-12-15',
            diagnosis: 'S13.0',
            cost: 150,
            imaging: 'None',
            notes: 'Annual physical examination - Patient in good health, recommended follow-up in 1 year'
          },
          {
            date: '2024-11-28',
            diagnosis: 'J30.9',
            cost: 75,
            imaging: 'None',
            notes: 'Seasonal allergies - Prescribed antihistamine medication'
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
            total_cost: 75,
            record_count: 1
          }
        ],
        errors: []
      },
      'Lab_Results_2024.pdf': {
        visits: [
          {
            date: '2024-11-15',
            diagnosis: 'R07.9',
            cost: 200,
            imaging: 'Chest X-ray',
            notes: 'Respiratory symptoms - X-ray showed clear lung fields, no abnormalities detected'
          },
          {
            date: '2024-10-20',
            diagnosis: 'Z51.11',
            cost: 120,
            imaging: 'None',
            notes: 'Blood work and lab tests - All results within normal range'
          }
        ],
        timeline: [
          {
            date: '2024-11-15',
            diagnosis: 'R07.9',
            cost: 200,
            imaging: 'Chest X-ray',
            notes: 'Respiratory symptoms - X-ray showed clear lung fields, no abnormalities detected'
          },
          {
            date: '2024-10-20',
            diagnosis: 'Z51.11',
            cost: 120,
            imaging: 'None',
            notes: 'Blood work and lab tests - All results within normal range'
          }
        ],
        monthly_summary: [
          {
            year: 2024,
            month: 11,
            total_cost: 200,
            record_count: 1
          },
          {
            year: 2024,
            month: 10,
            total_cost: 120,
            record_count: 1
          }
        ],
        errors: []
      },
      'Emergency_Visit_2024.pdf': {
        visits: [
          {
            date: '2024-09-05',
            diagnosis: 'S06.0',
            cost: 450,
            imaging: 'CT Scan',
            notes: 'Emergency room visit - Minor head injury treated, patient discharged in stable condition'
          }
        ],
        timeline: [
          {
            date: '2024-09-05',
            diagnosis: 'S06.0',
            cost: 450,
            imaging: 'CT Scan',
            notes: 'Emergency room visit - Minor head injury treated, patient discharged in stable condition'
          }
        ],
        monthly_summary: [
          {
            year: 2024,
            month: 9,
            total_cost: 450,
            record_count: 1
          }
        ],
        errors: []
      }
    };

    const sampleRawTexts = {
      'Medical_Records_2024.pdf': `Sample Medical Records OCR Text

PATIENT: John Doe
DOB: 01/15/1980
MRN: 123456789
PATIENT ID: PAT_SAMPLE123

MEDICAL HISTORY:
- Annual physical examination completed on 12/15/2024
- Diagnosis: S13.0 - Annual physical examination
- Cost: $150.00
- Notes: Patient in good health, recommended follow-up in 1 year

- Seasonal allergies diagnosed on 11/28/2024
- Diagnosis: J30.9 - Seasonal allergies
- Cost: $75.00
- Notes: Prescribed antihistamine medication

TREATMENT PLAN:
- Continue current medications
- Schedule follow-up appointment in 6 months
- Monitor allergy symptoms`,
      
      'Lab_Results_2024.pdf': `Sample Lab Results OCR Text

PATIENT: John Doe
DOB: 01/15/1980
MRN: 123456789
PATIENT ID: PAT_SAMPLE123

LABORATORY RESULTS:
- Date: 11/15/2024
- Diagnosis: R07.9 - Respiratory symptoms
- Imaging: Chest X-ray performed
- Cost: $200.00
- Results: Clear lung fields, no abnormalities detected

- Date: 10/20/2024
- Diagnosis: Z51.11 - Blood work and lab tests
- Cost: $120.00
- Results: All values within normal range

LAB VALUES:
- CBC: Normal
- Chemistry Panel: Normal
- Lipid Panel: Normal`,
      
      'Emergency_Visit_2024.pdf': `Sample Emergency Visit OCR Text

PATIENT: John Doe
DOB: 01/15/1980
MRN: 123456789
PATIENT ID: PAT_SAMPLE123

EMERGENCY DEPARTMENT VISIT:
- Date: 09/05/2024
- Diagnosis: S06.0 - Minor head injury
- Imaging: CT Scan performed
- Cost: $450.00
- Treatment: Minor injury treated, patient discharged in stable condition

ASSESSMENT:
- Patient presented with minor head injury
- CT scan showed no intracranial bleeding
- Patient was alert and oriented
- Discharged with instructions for home care`
    };

    // Set the sample data
    setResults(sampleResults);
    setRawTexts(sampleRawTexts);
    setShowRawText(true);
    
    console.log('📊 Sample data loaded successfully');
    console.log('👤 Patient: John Doe (PAT_SAMPLE123)');
    console.log('📁 Documents: 3 files loaded');
    console.log('💰 Total Cost: $995.00');
  };

  const loadPatients = async () => {
    console.log('👥 Loading patients...');
    try {
      const response = await fetch(getApiUrl('/google-ocr/patients'));
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
      const response = await fetch(getApiUrl(`/google-ocr/patient-files/${encodeURIComponent(patientName)}`));
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
    setSelectedPatient('');
    setCurrentPatientId('');
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

  const handleServisAiSync = () => {
    // TODO: Implement Servis.ai integration
    alert('Servis.ai sync functionality coming soon! This will automatically sync medical data from Servis.ai platform.');
  };

  const downloadTimelinePDF = () => {
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    if (!printWindow) {
      alert('Please allow popups to download the PDF');
      return;
    }

    const currentPatientName = selectedPatient || patientName || 'Unknown Patient';
    const patientId = currentPatientId || 'N/A';
    const totalDocuments = Object.keys(results).length;
    const totalVisits = Object.values(results).reduce((total, result) => total + (result.timeline?.length || 0), 0);
    const totalCost = Object.values(results).reduce((total, result) => {
      const visitCosts = result.timeline?.map(visit => visit.cost || 0) || [];
      return total + visitCosts.reduce((sum, cost) => sum + cost, 0);
    }, 0);

    // Get all timeline events
    const allEvents = Object.entries(results).flatMap(([fileName, result]) => 
      convertToTimelineEvents(result.timeline, fileName)
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Medical Timeline - ${currentPatientName}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #3B82F6;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #1F2937;
            margin: 0 0 10px 0;
            font-size: 28px;
          }
          .patient-info {
            background: #EFF6FF;
            border: 1px solid #BFDBFE;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
          }
          .patient-info h2 {
            color: #1E40AF;
            margin: 0 0 15px 0;
            font-size: 20px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #DBEAFE;
          }
          .info-label {
            font-weight: 600;
            color: #374151;
          }
          .info-value {
            color: #1F2937;
          }
          .timeline-section {
            margin-bottom: 30px;
          }
          .timeline-section h2 {
            color: #1F2937;
            border-bottom: 2px solid #3B82F6;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .timeline-item {
            background: #F8FAFC;
            border-left: 4px solid #3B82F6;
            margin-bottom: 15px;
            padding: 15px;
            border-radius: 0 8px 8px 0;
          }
          .timeline-date {
            color: #3B82F6;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 5px;
          }
          .timeline-type {
            color: #059669;
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 5px;
          }
          .timeline-description {
            color: #374151;
            margin-bottom: 5px;
          }
          .timeline-source {
            color: #6B7280;
            font-size: 12px;
            font-style: italic;
          }
          .timeline-amount {
            color: #DC2626;
            font-weight: 600;
            font-size: 14px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #6B7280;
            font-size: 12px;
            border-top: 1px solid #E5E7EB;
            padding-top: 20px;
          }
          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #3B82F6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            z-index: 1000;
          }
          .print-button:hover {
            background: #2563EB;
          }
          @media print {
            body { margin: 0; }
            .header { page-break-after: avoid; }
            .patient-info { page-break-after: avoid; }
            .timeline-item { page-break-inside: avoid; }
            .print-button { display: none; }
          }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="window.print()">Print / Save as PDF</button>
        
        <div class="header">
          <h1>Medical Timeline Report</h1>
          <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>

        <div class="patient-info">
          <h2>Patient Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Patient Name:</span>
              <span class="info-value">${currentPatientName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Patient ID:</span>
              <span class="info-value">${patientId}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Total Documents:</span>
              <span class="info-value">${totalDocuments}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Total Visits:</span>
              <span class="info-value">${totalVisits}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Total Cost:</span>
              <span class="info-value">${formatCurrency(totalCost)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Date Range:</span>
              <span class="info-value">${allEvents.length > 0 ? `${allEvents[0].date} to ${allEvents[allEvents.length - 1].date}` : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div class="timeline-section">
          <h2>Combined Medical Timeline</h2>
          ${allEvents.map(event => `
            <div class="timeline-item">
              <div class="timeline-date">${formatDate(event.date)}</div>
              <div class="timeline-type">${event.type}</div>
              <div class="timeline-description">${event.description}</div>
              <div class="timeline-source">Source: ${event.source}</div>
              ${event.amount ? `<div class="timeline-amount">Cost: ${formatCurrency(event.amount)}</div>` : ''}
            </div>
          `).join('')}
        </div>

        <div class="footer">
          <p>This report was generated by the Medical Chronology System</p>
          <p>Patient confidentiality and privacy are maintained in accordance with HIPAA guidelines</p>
        </div>

        <script>
          // Auto-print after a short delay to ensure content is loaded
          setTimeout(() => {
            window.print();
          }, 500);
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
            Medical Chronology
          </h1>
          
          {/* Mobile-first layout - single column on mobile, two columns on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Patient Search Section */}
            <div className="bg-blue-50 rounded-lg overflow-hidden">
            {/* Header - Always visible */}
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Patient Search</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-xs sm:text-sm text-gray-600">
                    {patients.length > 0 ? `${patients.length} patient(s) found` : 'No patients loaded'}
                  </span>
                </div>
              </div>
            
            {/* Always Visible Content */}
            <div className="space-y-3 sm:space-y-4">
                <div className="space-y-3 sm:space-y-4">
                  {/* Autocomplete Search */}
                  <div className="relative">
                    <label htmlFor="patientSearch" className="block text-sm font-medium text-gray-700 mb-2">
                      Search Patients
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="patientSearch"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowAutocomplete(true);
                        }}
                        onFocus={() => setShowAutocomplete(true)}
                        placeholder="Type to search patients..."
                        className="w-full px-3 py-2 text-sm sm:text-base border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {showAutocomplete && searchQuery && filteredPatients.length > 0 && (
                        <div className="autocomplete-dropdown absolute z-10 w-full mt-1 bg-white border border-blue-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {filteredPatients.map((patient) => (
                            <div
                              key={patient.folder_name}
                              className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => {
                                setSearchQuery(patient.name);
                                setPatientName(patient.name);
                                setSelectedPatient(patient.name);
                                setCurrentPatientId(patient.patient_id);
                                loadPatientFiles(patient.name);
                                setShowAutocomplete(false);
                              }}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                                <span className="font-medium text-gray-900 text-sm sm:text-base">{patient.name}</span>
                                <span className="text-xs sm:text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full self-start sm:self-auto">
                                  {patient.file_count} files
                                </span>
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500">Folder: {patient.folder_name}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Selected Patient Info */}
                  {selectedPatient && (
                    <div className="bg-white rounded-lg border border-blue-200 p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Selected Patient</h3>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{selectedPatient}</h4>
                          <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                            {patients.find(p => p.name === selectedPatient)?.file_count || 0} files
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          Folder: {patients.find(p => p.name === selectedPatient)?.folder_name || 'N/A'}
                        </p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => loadPatientFiles(selectedPatient)}
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            View Files
                          </button>
                          <span className="text-gray-400">|</span>
                          <button
                            onClick={() => {
                              setSearchQuery('');
                              setSelectedPatient('');
                              setPatientName('');
                              setCurrentPatientId('');
                            }}
                            className="text-sm text-red-600 hover:text-red-800 underline"
                          >
                            Clear Selection
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
            {/* File Upload Section - Collapsible */}
            <div className="bg-blue-50 rounded-lg overflow-hidden">
            {/* Header - Always visible */}
            <div 
              className="p-4 sm:p-6 cursor-pointer hover:bg-blue-100 transition-colors"
              onClick={() => setIsUploadPanelExpanded(!isUploadPanelExpanded)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Upload Medical Documents</h2>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  {/* Servis.ai Sync Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleServisAiSync();
                    }}
                    className="px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-xs sm:text-sm flex items-center justify-center space-x-1 sm:space-x-2 transition-colors"
                    title="Sync data from Servis.ai (Coming Soon)"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Sync Servis.ai</span>
                  </button>
                  <span className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                    {files.length > 0 ? `${files.length} file(s) selected` : 'No files selected'}
                  </span>
                  <svg 
                    className={`w-5 h-5 text-gray-600 transition-transform ${isUploadPanelExpanded ? 'rotate-180' : ''} self-center`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            
                        {/* Collapsible Content */}
            {isUploadPanelExpanded && (
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-blue-200">
                {/* File Upload Section */}
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label htmlFor="fileInput" className="block text-sm font-medium text-gray-700 mb-2">
                      Select Medical Documents *
                    </label>
                    <input
                      type="file"
                      id="fileInput"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-500 file:mr-2 sm:file:mr-4 file:py-2 file:px-2 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 sm:gap-3">
                    <button
                      onClick={handleUpload}
                      disabled={files.length === 0 || isUploading}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                      title={`Files: ${files.length}, Uploading: ${isUploading}`}
                    >
                      {isUploading ? 'Processing...' : 'Upload & Extract'}
                    </button>
                    <button
                      onClick={testExtraction}
                      disabled={isUploading}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                      Test Extraction
                    </button>
                    <button
                      onClick={showSampleData}
                      disabled={isUploading}
                      className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Sample
                    </button>
                    <button
                      onClick={clearForm}
                      disabled={isUploading}
                      className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Clear Form
                    </button>
                  </div>

                  {/* Status Info */}
                  <div className="text-xs text-gray-500">
                    Status: Files={files.length} | Uploading={isUploading ? 'Yes' : 'No'}
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
              </div>
            )}
          </div>



          </div>
          {/* End of Two Column Layout */}

          {/* Results Section - Full Width */}
          {Object.keys(results).length > 0 && (
            <div className="space-y-8">
              {/* Patient Information Panel */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Patient Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Patient Summary */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Patient Summary</h4>
                    <div className="space-y-3">
                      {/* Patient Name */}
                      <div className="border-b border-blue-200 pb-2">
                        <div className="flex items-center">
                          <span className="text-lg font-semibold text-blue-900">
                            {selectedPatient || patientName || 'Unknown Patient'}
                          </span>
                          {selectedPatient && (
                            <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                              Selected
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Patient Metadata */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Patient ID:</span>
                          <span className="text-sm text-gray-900">
                            {currentPatientId || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Total Documents:</span>
                          <span className="text-sm text-gray-900">{Object.keys(results).length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Total Visits:</span>
                          <span className="text-sm text-gray-900">
                            {Object.values(results).reduce((total, result) => total + (result.timeline?.length || 0), 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Total Cost:</span>
                          <span className="text-sm text-gray-900">
                            ${Object.values(results).reduce((total, result) => {
                              const visitCosts = result.timeline?.map(visit => visit.cost || 0) || [];
                              return total + visitCosts.reduce((sum, cost) => sum + cost, 0);
                            }, 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Date Range:</span>
                          <span className="text-sm text-gray-900">
                            {(() => {
                              const allDates = Object.values(results).flatMap(result => 
                                result.timeline?.map(visit => visit.date).filter(Boolean) || []
                              );
                              if (allDates.length === 0) return 'N/A';
                              const sortedDates = allDates.sort();
                              return `${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}`;
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Last Updated:</span>
                          <span className="text-sm text-gray-900">
                            {new Date().toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Document Types */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Document Types</h4>
                    <div className="space-y-2">
                      {Object.keys(results).map((fileName, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 truncate">{fileName}</span>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            {fileName.split('.').pop()?.toUpperCase() || 'PDF'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                                    {/* Medical Conditions */}
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Medical Conditions</h4>
                    <div className="space-y-2">
                      {(() => {
                        const allDiagnoses = Object.values(results).flatMap(result => 
                          result.timeline?.map(visit => ({
                            diagnosis: visit.diagnosis,
                            notes: visit.notes,
                            date: visit.date
                          })).filter(item => item.diagnosis) || []
                        );
                        
                        const uniqueDiagnoses = Array.from(
                          new Set(allDiagnoses.map(item => item.diagnosis))
                        ).map(diagnosis => {
                          const items = allDiagnoses.filter(item => item.diagnosis === diagnosis);
                          return {
                            diagnosis,
                            notes: items[0]?.notes || '',
                            date: items[0]?.date || ''
                          };
                        });
                        
                        if (uniqueDiagnoses.length === 0) {
                          return <span className="text-sm text-gray-500">No diagnoses recorded</span>;
                        }
                        
                        return uniqueDiagnoses.slice(0, 5).map((item, index) => (
                          <div key={index} className="flex items-start">
                            <span className="w-2 h-2 bg-purple-400 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-700">{item.diagnosis}</div>
                              {item.notes && (
                                <div className="text-xs text-gray-500 mt-1">{item.notes}</div>
                              )}
                            </div>
                          </div>
                        ));
                      })()}
                      {(() => {
                        const allDiagnoses = Object.values(results).flatMap(result => 
                          result.timeline?.map(visit => visit.diagnosis).filter(Boolean) || []
                        );
                        const uniqueDiagnoses = Array.from(new Set(allDiagnoses));
                        if (uniqueDiagnoses.length > 5) {
                          return (
                            <div className="text-xs text-purple-600 mt-2">
                              +{uniqueDiagnoses.length - 5} more conditions
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Combined Medical Timeline */}
              <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Combined Medical Timeline</h3>
                  <button
                    onClick={downloadTimelinePDF}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download PDF</span>
                  </button>
                </div>
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
              <div className="bg-blue-50 rounded-lg overflow-hidden">
                {/* Header - Always visible */}
                <div 
                  className="p-6 cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => setIsDemoTimelineExpanded(!isDemoTimelineExpanded)}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">Demo Medical Timeline</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        Preview of medical timeline
                      </span>
                      <svg 
                        className={`w-5 h-5 text-gray-600 transition-transform ${isDemoTimelineExpanded ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Collapsible Content */}
                {isDemoTimelineExpanded && (
                  <div className="px-6 pb-6 border-t border-blue-200">
                    <p className="text-gray-600 mb-4">This is a preview of how your medical timeline will look after uploading documents.</p>
                    <MedicalTimeline events={demoEvents} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalChronology1; 