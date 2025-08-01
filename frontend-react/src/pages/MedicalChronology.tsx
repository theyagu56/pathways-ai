import React, { useState } from 'react';

interface VisitDetail {
  date?: string;
  diagnosis?: string;
  imaging?: string;
  cost?: number;
  notes?: string;
}

interface MonthlySummary {
  year: number;
  month: number;
  total_cost: number;
  record_count: number;
}

interface OCRResult {
  visits: VisitDetail[];
  timeline: VisitDetail[];
  monthly_summary: MonthlySummary[];
  raw_text?: string;
  errors?: string[];
  db_id?: number;
}

const MedicalChronology: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setOcrResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
              const res = await fetch('http://localhost:8000/ocr/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setOcrResult(data);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!ocrResult?.db_id) return;
            window.open(`http://localhost:8000/ocr/download/${ocrResult.db_id}`, '_blank');
  };

  // Bar chart SVG for records per month
  const renderBarChart = (summary: MonthlySummary[]) => {
    if (!summary.length) return null;
    const maxCount = Math.max(...summary.map(s => s.record_count));
    const barWidth = 40;
    const barGap = 16;
    const chartHeight = 120;
    return (
      <svg width={(barWidth + barGap) * summary.length} height={chartHeight + 40} style={{ background: '#fafafa', borderRadius: 4 }}>
        {summary.map((s, i) => {
          const barHeight = (s.record_count / maxCount) * chartHeight;
          return (
            <g key={i}>
              <rect
                x={i * (barWidth + barGap)}
                y={chartHeight - barHeight + 20}
                width={barWidth}
                height={barHeight}
                fill="#4f8cff"
              />
              <text
                x={i * (barWidth + barGap) + barWidth / 2}
                y={chartHeight + 35}
                textAnchor="middle"
                fontSize={12}
                fill="#333"
              >
                {s.year}/{String(s.month).padStart(2, '0')}
              </text>
              <text
                x={i * (barWidth + barGap) + barWidth / 2}
                y={chartHeight - barHeight + 15}
                textAnchor="middle"
                fontSize={12}
                fill="#333"
              >
                {s.record_count}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1>Medical Chronology</h1>
      <input type="file" accept="application/pdf,image/*" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file || loading} style={{ marginLeft: 8 }}>
        {loading ? 'Uploading...' : 'Upload & Extract'}
      </button>
      {error && <div style={{ color: 'red', marginTop: 16 }}>{error}</div>}
      {ocrResult && (
        <div style={{ marginTop: 32 }}>
          <h2>Extraction Result</h2>
          <button onClick={handleDownload} disabled={!ocrResult.db_id} style={{ marginBottom: 16 }}>
            Download CSV
          </button>

          {/* Timeline Table */}
          <h3>Visit Timeline</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead>
              <tr style={{ background: '#f0f4fa' }}>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Date</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Diagnosis</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Imaging</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Cost</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {ocrResult.timeline.map((visit, i) => (
                <tr key={i}>
                  <td style={{ padding: 8, border: '1px solid #eee' }}>{visit.date || '-'}</td>
                  <td style={{ padding: 8, border: '1px solid #eee' }}>{visit.diagnosis || '-'}</td>
                  <td style={{ padding: 8, border: '1px solid #eee' }}>{visit.imaging || '-'}</td>
                  <td style={{ padding: 8, border: '1px solid #eee' }}>{visit.cost !== undefined ? `$${visit.cost}` : '-'}</td>
                  <td style={{ padding: 8, border: '1px solid #eee' }}>{visit.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Monthly Billing Summary Table */}
          <h3>Monthly Billing Summary</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead>
              <tr style={{ background: '#f0f4fa' }}>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Year</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Month</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Total Cost</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Record Count</th>
              </tr>
            </thead>
            <tbody>
              {ocrResult.monthly_summary.map((summary, i) => (
                <tr key={i}>
                  <td style={{ padding: 8, border: '1px solid #eee' }}>{summary.year}</td>
                  <td style={{ padding: 8, border: '1px solid #eee' }}>{summary.month}</td>
                  <td style={{ padding: 8, border: '1px solid #eee' }}>${summary.total_cost.toFixed(2)}</td>
                  <td style={{ padding: 8, border: '1px solid #eee' }}>{summary.record_count}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Bar Chart */}
          <h3>Records Per Month</h3>
          <div style={{ marginBottom: 32 }}>{renderBarChart(ocrResult.monthly_summary)}</div>

          {/* Raw Text and Errors */}
          <details>
            <summary>Show Raw OCR Text & Errors</summary>
            <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 4, marginTop: 8 }}>
              {ocrResult.raw_text}
            </pre>
            {ocrResult.errors && ocrResult.errors.length > 0 && (
              <div style={{ color: 'red', marginTop: 8 }}>
                <b>Errors:</b>
                <ul>
                  {ocrResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}
          </details>
        </div>
      )}
    </div>
  );
};

export default MedicalChronology; 