import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { compressPDF} from "../services/http/pdf";
import { fetchProgress } from "../services/http/common";
import { 
  Upload, 
  ArrowDownToLine, 
  FileText, 
  X, 
  Check, 
  Loader2, 
  Download, 
  RefreshCw,
  CloudUpload,
  Settings,
  Info
} from "lucide-react";

export default function CompressPDF() {
  // File states
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  
  // Processing states
  const [isUploading, setIsUploading] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState(null); // 'uploading', 'processing', 'completed', 'error'
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState(null);
  
  // Compression settings
  const [compressionLevel, setCompressionLevel] = useState("medium"); // low, medium, high
  const [showSettings, setShowSettings] = useState(false);
  
  // Progress polling
  const progressInterval = useRef(null);

  // File size conversion
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Handle file selection
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    
    if (!selectedFile) return;
    
    // Check file size (25MB max)
    if (selectedFile.size > 25 * 1024 * 1024) {
      setError("File size exceeds 25MB limit.");
      return;
    }
    
    // Check file type
    if (selectedFile.type !== "application/pdf") {
      setError("Please select a PDF file.");
      return;
    }
    
    setError(null);
    setFile(selectedFile);
  };

  // Handle Google Drive selection
  const handleGoogleDriveSelect = () => {
    // This would typically integrate with Google Drive Picker API
    // For this example, we'll just show a message
    alert("Google Drive integration would open a picker here");
    
    // Simulating a file selection for demonstration
    // In a real implementation, this would come from the Google Drive API
    // setFile(...) would happen after selection
  };

  // Toggle compression settings panel
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  // Upload and process the image
  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setProcessingStatus("uploading");
    setProgress(0);

    try {
      const { task_id } = await compressPDF(file, compressionLevel);
      setTaskId(task_id);
      setProcessingStatus("processing");
      startProgressPolling(task_id);
    } catch (err) {
      setError("Failed to upload image. Please try again.");
      setProcessingStatus("error");
      setIsUploading(false);
    }
  };

  // Poll for task progress
  const startProgressPolling = (taskId) => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    progressInterval.current = setInterval(async () => {
      try {
        const { progress, result_url } = await fetchProgress(taskId);

        setProgress(progress);

        if (progress >= 100) {
          clearInterval(progressInterval.current);
          setProcessingStatus("completed");
          if (result_url) setResultUrl(result_url);
        }
      } catch (err) {
        clearInterval(progressInterval.current);
        setError("Failed to fetch progress.");
        setProcessingStatus("error");
      }
    }, 1000);
  };

  //Download Image
  const downloadResult = async () => {
    if (!resultUrl) return;

    try {
      const response = await fetch(resultUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // You can set a default filename here
      link.download = "compressed_pdf" + resultUrl.substring(resultUrl.lastIndexOf("."));
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to download the file.");
    }
  };

  // Reset everything to start over
  const handleReset = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    
    setFile(null);
    setTaskId(null);
    setProgress(0);
    setProcessingStatus(null);
    setResultUrl(null);
    setError(null);
    setIsUploading(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Clean up interval on component unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-4">PDF Compression</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Reduce the file size of your PDF documents while maintaining readability. 
          Ideal for email attachments, website uploads, and saving storage space.
        </p>
      </motion.div>

      {/* Main content area */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* File Upload Section */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload PDF</h2>

          {!file ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full max-w-md border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                onClick={() => fileInputRef.current.click()}
              >
                <div className="flex flex-col items-center">
                  <div className="h-14 w-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <Upload className="h-6 w-6 text-red-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF files only (MAX. 25MB)
                  </p>
                </div>
              </motion.div>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="application/pdf"
                onChange={handleFileChange}
              />

              <div className="flex items-center mt-6">
                <div className="flex-grow h-px bg-gray-200"></div>
                <span className="mx-4 text-sm text-gray-400">OR</span>
                <div className="flex-grow h-px bg-gray-200"></div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-6 flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                onClick={handleGoogleDriveSelect}
              >
                <CloudUpload className="mr-2 h-4 w-4 text-gray-500" />
                Import from Google Drive
              </motion.button>

              {error && (
                <div className="mt-4 text-sm text-red-600">
                  {error}
                </div>
              )}
            </motion.div>
          ) : (
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
              {/* PDF Icon/Preview */}
              <div className="w-full md:w-1/3 relative">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                  <div className="flex flex-col items-center justify-center">
                    <FileText className="h-16 w-16 text-red-500" />
                    <p className="mt-2 text-sm font-medium text-gray-700 max-w-[200px] truncate">
                      {file.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* File Details */}
              <div className="w-full md:w-2/3">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 break-all">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatFileSize(file.size)}
                      </p>
                      
                    </div>
                    <button 
                      onClick={handleReset}
                      className="p-1.5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {!processingStatus ? (
                  <div className="space-y-4">
                    {/* Compression Settings Button */}
                    <div className="flex justify-end">
                      <button 
                        onClick={toggleSettings}
                        className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Compression Settings
                      </button>
                    </div>
                    
                    {/* Settings Panel */}
                    {showSettings && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Compression Level</h4>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => setCompressionLevel("low")}
                            className={`px-3 py-1.5 text-xs font-medium rounded ${
                              compressionLevel === "low" 
                                ? "bg-blue-100 text-blue-800 border border-blue-300" 
                                : "bg-white border border-gray-300 text-gray-700"
                            }`}
                          >
                            Low (Better Quality)
                          </button>
                          <button
                            onClick={() => setCompressionLevel("medium")}
                            className={`px-3 py-1.5 text-xs font-medium rounded ${
                              compressionLevel === "medium" 
                                ? "bg-blue-100 text-blue-800 border border-blue-300" 
                                : "bg-white border border-gray-300 text-gray-700"
                            }`}
                          >
                            Medium (Balanced)
                          </button>
                          <button
                            onClick={() => setCompressionLevel("high")}
                            className={`px-3 py-1.5 text-xs font-medium rounded ${
                              compressionLevel === "high" 
                                ? "bg-blue-100 text-blue-800 border border-blue-300" 
                                : "bg-white border border-gray-300 text-gray-700"
                            }`}
                          >
                            High (Smaller Size)
                          </button>
                        </div>
                        <div className="mt-2 flex items-start">
                          <Info className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-500">
                            Higher compression may affect image quality and text sharpness in PDFs with complex graphics.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleUpload}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 flex items-center justify-center"
                      >
                        <ArrowDownToLine className="mr-2 h-4 w-4" />
                        Compress PDF
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleReset}
                        className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
                      >
                        Cancel
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                      <motion.div
                        className="bg-red-600 h-2.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                      ></motion.div>
                    </div>
                    
                    {/* Status Text */}
                    <div className="flex items-center">
                      {processingStatus === "uploading" && (
                        <>
                          <Loader2 className="animate-spin mr-2 h-4 w-4 text-red-600" />
                          <span className="text-sm text-gray-700">Uploading PDF...</span>
                        </>
                      )}
                      
                      {processingStatus === "processing" && (
                        <>
                          <Loader2 className="animate-spin mr-2 h-4 w-4 text-red-600" />
                          <span className="text-sm text-gray-700">
                            Processing... {Math.round(progress)}%
                          </span>
                        </>
                      )}
                      
                      {processingStatus === "completed" && (
                        <>
                          <Check className="mr-2 h-4 w-4 text-green-600" />
                          <span className="text-sm text-gray-700">Compression completed!</span>
                        </>
                      )}
                      
                      {processingStatus === "error" && (
                        <>
                          <X className="mr-2 h-4 w-4 text-red-600" />
                          <span className="text-sm text-red-600">{error}</span>
                        </>
                      )}
                    </div>
                    
                    {/* Result Actions */}
                    {processingStatus === "completed" && resultUrl && (
                      <div className="flex space-x-3 mt-4">
                        <motion.a
                          onClick={downloadResult}
                          download
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="flex-1 bg-green-600 cursor-pointer text-white py-2 px-4 rounded-md hover:bg-green-700 flex items-center justify-center"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download Compressed PDF
                        </motion.a>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={handleReset}
                          className="bg-blue-50 text-blue-700 py-2 px-4 rounded-md hover:bg-blue-100 flex items-center justify-center"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Start Over
                        </motion.button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Information Section */}
        <div className="p-6 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Why Compress PDFs?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold text-red-600 mb-2">Email Friendly</h4>
              <p className="text-sm text-gray-600">
                Most email services limit attachment size. Compressed PDFs are easier to send and receive.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold text-red-600 mb-2">Save Storage Space</h4>
              <p className="text-sm text-gray-600">
                Reduce file sizes by up to 70% while keeping document quality acceptable.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold text-red-600 mb-2">Faster Uploads</h4>
              <p className="text-sm text-gray-600">
                Website uploads and document sharing become quicker with smaller file sizes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-12 bg-red-50 rounded-xl shadow-sm p-6"
      >
        <h2 className="text-xl font-semibold text-center text-gray-800 mb-6">
          PDF Compression Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Intelligent compression</h3>
              <p className="mt-1 text-sm text-gray-500">
                Our smart algorithm optimizes text, images, and graphics separately for best results.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Preserves content fidelity</h3>
              <p className="mt-1 text-sm text-gray-500">
                Text remains sharp and readable even after significant compression.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Form field preservation</h3>
              <p className="mt-1 text-sm text-gray-500">
                Interactive elements like forms and links remain functional after compression.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Batch processing</h3>
              <p className="mt-1 text-sm text-gray-500">
                Premium users can compress multiple PDFs at once with our bulk processing tool.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}