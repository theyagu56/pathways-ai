import React, { useState } from 'react';

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
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<OCRExtractionResult | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [showRawText, setShowRawText] = useState(false);
  const [downloadId, setDownloadId] = useState<number | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setRawText('');
      setDownloadId(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
              const response = await fetch('http://localhost:8000/google-ocr/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        setRawText(data.raw_text || '');
        setDownloadId(data.id || null);
      } else {
        const errorData = await response.json();
        alert(`Upload failed: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async () => {
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
        a.download = `medical_chronology_${downloadId}.csv`;
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
        setResult(data);
        setRawText(data.raw_text || '');
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Medical Chronology 1 (Google Vision API)
          </h1>
          
          {/* File Upload Section */}
          <div className="mb-8 p-6 bg-blue-50 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Medical Document</h2>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Processing...' : 'Upload & Extract'}
              </button>
              <button
                onClick={testExtraction}
                disabled={isUploading}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Test Extraction
              </button>
            </div>
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected file: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Results Section */}
          {result && (
            <div className="space-y-8">
              {/* Download Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleDownload}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Download CSV
                </button>
              </div>

              {/* Visit Timeline */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Visit Timeline (Reverse Chronological)</h3>
                {result.timeline.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diagnosis</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Imaging</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {result.timeline.map((visit, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(visit.date || '')}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                              {visit.diagnosis || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {visit.cost ? formatCurrency(visit.cost) : 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                              {visit.imaging || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                              {visit.notes || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">No visits found in the document.</p>
                )}
              </div>

              {/* Monthly Billing Summary */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Monthly Billing Summary</h3>
                {result.monthly_summary.length > 0 ? (
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
                        {result.monthly_summary.map((summary, index) => (
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
                ) : (
                  <p className="text-gray-500">No billing data found.</p>
                )}
              </div>

              {/* Records per Month Chart */}
              {result.monthly_summary.length > 0 && (
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Records per Month</h3>
                  <div className="flex items-end space-x-2 h-64">
                    {result.monthly_summary.map((summary, index) => {
                      const maxVisits = Math.max(...result.monthly_summary.map(s => s.record_count));
                      const height = maxVisits > 0 ? (summary.record_count / maxVisits) * 200 : 0;
                      return (
                        <div key={index} className="flex flex-col items-center">
                          <div
                            className="bg-blue-500 rounded-t w-16"
                            style={{ height: `${height}px` }}
                            title={`${summary.year}-${summary.month.toString().padStart(2, '0')}: ${summary.record_count} visits`}
                          />
                          <div className="text-xs text-gray-600 mt-2 text-center">
                            {summary.month.toString().padStart(2, '0')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Raw OCR Text */}
              <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Raw OCR Text</h3>
                  <button
                    onClick={() => setShowRawText(!showRawText)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    {showRawText ? 'Hide' : 'Show'} Raw Text
                  </button>
                </div>
                {showRawText && (
                  <div className="bg-gray-100 p-4 rounded-md">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap">{rawText}</pre>
                  </div>
                )}
              </div>

              {/* Errors */}
              {result.errors && result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-red-900 mb-4">Errors</h3>
                  <ul className="list-disc list-inside text-red-700">
                    {result.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalChronology1; 