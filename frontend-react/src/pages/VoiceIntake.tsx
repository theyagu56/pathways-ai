import React, { useState, useRef } from "react";

interface VoiceIntakeProps {
  addLog: (type: "info" | "warning" | "error" | "success", message: string, details?: string) => void;
}

interface ProcessingResult {
  voice_processing?: {
    transcription: string;
    confidence: number;
    processing_method: string;
  };
  extracted_info: {
    symptoms: string;
    zip_code: string;
    insurance: string;
  };
  specialty_recommendations: string[];
  providers: any[];
  total_providers_found: number;
}

const VoiceIntake: React.FC<VoiceIntakeProps> = ({ addLog }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ProcessingResult | null>(null);
  const [textInput, setTextInput] = useState("");
  const [inputMode, setInputMode] = useState<"voice" | "text" | "file">("voice");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Insurance will be extracted from voice/text input automatically

  const startRecording = async () => {
    try {
      addLog("info", "Requesting microphone access", "Please allow microphone permissions...");
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia is not supported in this browser");
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      
      streamRef.current = stream;
      addLog("success", "Microphone access granted", "Stream obtained successfully");
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          addLog("info", "Audio data received", `Chunk size: ${event.data.size} bytes`);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        addLog("success", "Audio recording completed", `Total size: ${blob.size} bytes, Duration: ${chunks.length} chunks`);
      };
      
      mediaRecorder.onerror = (event) => {
        const errorMessage = event instanceof ErrorEvent ? event.error : 'Unknown MediaRecorder error';
        addLog("error", "MediaRecorder error", `Error: ${errorMessage}`);
        console.error("MediaRecorder error:", errorMessage);
      };
      
      mediaRecorder.start(1000); // Record in 1-second chunks
      setIsRecording(true);
      addLog("info", "Started audio recording", "Recording in progress...");
      
    } catch (error) {
      console.error("Error starting recording:", error);
      addLog("error", "Failed to start recording", error as string);
      setError(`Failed to access microphone: ${error}`);
      
      // Provide specific guidance based on error type
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          setError("Microphone access denied. Please allow microphone permissions in your browser.");
        } else if (error.name === 'NotFoundError') {
          setError("No microphone found. Please connect a microphone and try again.");
        } else if (error.name === 'NotSupportedError') {
          setError("Audio recording is not supported in this browser. Please use a modern browser.");
        }
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      addLog("info", "Stopped audio recording", "Processing audio...");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioBlob(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      addLog("info", "Audio file uploaded", `File: ${file.name}, Size: ${file.size} bytes`);
    }
  };

  const processAudio = async () => {
    if (!audioBlob) {
      setError("Please record audio first");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append("audio_file", audioBlob, "recording.wav");
      // Insurance will be extracted from the audio content automatically

      addLog("info", "Processing audio", "Extracting symptoms, location, and insurance from voice...");

      const response = await fetch("http://localhost:8000/api/voice/upload-audio", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to process audio");
      }

      const data = await response.json();
      setResults(data);
      
      // Voice processing results are displayed in the results section

      addLog("success", `Found ${data.total_providers_found} providers`, 
        `Specialties: ${data.specialty_recommendations.join(", ")}`);

    } catch (err: any) {
      setError(err.message || "Unknown error");
      addLog("error", "Audio processing failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const processText = async () => {
    if (!textInput.trim()) {
      setError("Please enter symptoms and details");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append("text_input", textInput);
      // Insurance will be extracted from the text content automatically

      addLog("info", "Processing text input", "Extracting symptoms, location, and insurance from text...");

      const response = await fetch("http://localhost:8000/api/voice/process-text", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to process text");
      }

      const data = await response.json();
      setResults(data);
      addLog("success", `Found ${data.total_providers_found} providers`, 
        `Specialties: ${data.specialty_recommendations.join(", ")}`);

    } catch (err: any) {
      setError(err.message || "Unknown error");
      addLog("error", "Text processing failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults(null);
    setAudioBlob(null);
    setAudioUrl("");
    setTextInput("");
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center">Voice Intake</h1>
      
      {/* Input Mode Selection */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mb-4">
          <button
            onClick={() => setInputMode("voice")}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base ${
              inputMode === "voice" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-200 text-gray-700"
            }`}
          >
            🎤 Voice Memo
          </button>
          <button
            onClick={() => setInputMode("file")}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base ${
              inputMode === "file" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-200 text-gray-700"
            }`}
          >
            📁 File Upload
          </button>
          <button
            onClick={() => setInputMode("text")}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base ${
              inputMode === "text" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-200 text-gray-700"
            }`}
          >
            ✏️ Notes
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">📋 Instructions</h3>
        <p className="text-blue-700 text-xs sm:text-sm">
          Speak or type your symptoms, include your zip code, and mention your insurance provider. 
          The system will automatically extract all information and find the best healthcare providers for you.
        </p>
      </div>

      {/* Voice Recording Section */}
      {inputMode === "voice" && (
        <div className="mb-6 p-6 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">Voice Recording</h2>
          
          {/* Browser Compatibility Check */}
          {(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
              ⚠️ Your browser doesn't support audio recording. Please use a modern browser like Chrome, Firefox, or Safari.
            </div>
          )}
          
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`px-6 py-3 rounded-lg font-medium ${
                isRecording 
                  ? "bg-red-600 text-white hover:bg-red-700" 
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {isRecording ? "⏹️ Stop Recording" : "🎤 Start Recording"}
            </button>
            
            <button
              onClick={async () => {
                try {
                  addLog("info", "Testing microphone access", "Checking if microphone is available...");
                  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                  addLog("success", "Microphone test successful", "Microphone is working correctly");
                  stream.getTracks().forEach(track => track.stop());
                } catch (error) {
                  addLog("error", "Microphone test failed", error as string);
                  setError(`Microphone test failed: ${error}`);
                }
              }}
              className="px-4 py-3 rounded-lg font-medium bg-gray-600 text-white hover:bg-gray-700"
            >
              🔍 Test Microphone
            </button>
            
            {isRecording && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-600 font-medium">Recording...</span>
              </div>
            )}
          </div>

          {audioUrl && (
            <div className="mb-4">
              <audio controls src={audioUrl} className="w-full" />
              <button
                onClick={processAudio}
                disabled={loading}
                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-400"
              >
                {loading ? "Processing..." : "Process Audio"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* File Upload Section */}
      {inputMode === "file" && (
        <div className="mb-6 p-6 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">Upload Audio File</h2>
          
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="w-full p-3 border rounded-lg"
          />
          
          {audioUrl && (
            <div className="mt-4">
              <audio controls src={audioUrl} className="w-full" />
              <button
                onClick={processAudio}
                disabled={loading}
                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-400"
              >
                {loading ? "Processing..." : "Process Audio"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Text Input Section */}
      {inputMode === "text" && (
        <div className="mb-6 p-6 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">Text Input</h2>
          
          <textarea
            className="w-full border rounded-lg p-3 h-32"
            placeholder="Describe your symptoms, injury, or health concern. Include your zip code if possible..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
          />
          
          <button
            onClick={processText}
            disabled={loading || !textInput.trim()}
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-400"
          >
            {loading ? "Processing..." : "Process Text"}
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mb-6 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Processing your request...</span>
          </div>
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="space-y-6">
          {/* Transcription Results */}
          {results.voice_processing && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Voice Transcription</h3>
              <p className="text-green-700 mb-2">{results.voice_processing.transcription}</p>
              <div className="text-sm text-green-600">
                Confidence: {(results.voice_processing.confidence * 100).toFixed(1)}% | 
                Method: {results.voice_processing.processing_method}
              </div>
            </div>
          )}

          {/* Patient Information Summary */}
          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="font-bold text-xl text-gray-800 mb-4">📋 Patient Information Summary</h3>
            
            {/* Incident Details */}
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h4 className="font-semibold text-orange-800 mb-3 flex items-center">
                🚨 Incident Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-700">Location (ZIP Code):</span>
                  <p className="text-lg font-semibold text-gray-900">
                    {results.extracted_info.zip_code || "Not specified"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Insurance Provider:</span>
                  <p className="text-lg font-semibold text-gray-900">
                    {results.extracted_info.insurance || "Not specified"}
                  </p>
                </div>
              </div>
            </div>

            {/* Symptoms */}
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-3 flex items-center">
                🏥 Symptoms & Medical Concerns
              </h4>
              <div className="bg-white p-3 rounded border">
                <p className="text-gray-900 leading-relaxed">
                  {results.extracted_info.symptoms || "No symptoms extracted"}
                </p>
              </div>
            </div>

            {/* Voice Transcription */}
            {results.voice_processing && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                  🎤 Voice Transcription
                </h4>
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-900 italic">"{results.voice_processing.transcription}"</p>
                </div>
                <div className="text-sm text-green-600 mt-2">
                  Confidence: {(results.voice_processing.confidence * 100).toFixed(1)}% | 
                  Method: {results.voice_processing.processing_method}
                </div>
              </div>
            )}
          </div>

          {/* Specialty Recommendations */}
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-2">Recommended Specialties</h3>
            <div className="flex flex-wrap gap-2">
              {results.specialty_recommendations.map((specialty, idx) => (
                <span key={idx} className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm">
                  {specialty}
                </span>
              ))}
            </div>
          </div>

          {/* Provider Results */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">
              Found {results.total_providers_found} Providers
            </h3>
            <div className="space-y-4">
              {results.providers.map((provider, idx) => (
                <div key={idx} className="p-4 bg-white border rounded-lg shadow-sm">
                  <div className="font-bold text-lg">{provider.name}</div>
                  <div className="text-gray-600">Specialty: {provider.specialty}</div>
                  <div className="text-gray-600">Distance: {provider.distance} miles</div>
                  <div className="text-gray-600">Availability: {provider.availability}</div>
                  <div className="text-sm text-gray-500 mt-2">
                    Reason: {provider.ranking_reason}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clear Results Button */}
          <button
            onClick={clearResults}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Start New Search
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceIntake; 