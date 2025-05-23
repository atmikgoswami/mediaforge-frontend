import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { uploadImage } from "../services/http/image";
import { fetchProgress } from "../services/http/common";
import { 
  Upload, 
  ArrowDownToLine, 
  Image, 
  X, 
  Check, 
  Loader2, 
  Download, 
  RefreshCw,
  CloudUpload,
  Settings,
  ChevronDown
} from "lucide-react";

export default function CompressImage() {
  // File states
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const fileInputRef = useRef(null);
  
  // Processing states
  const [isUploading, setIsUploading] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState(null); // 'uploading', 'processing', 'completed', 'error'
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState(null);

  // Settings states
  const [showSettings, setShowSettings] = useState(false);
  const [preserveFormat, setPreserveFormat] = useState(true);
  const [targetSizeKb, setTargetSizeKb] = useState('');
  
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
    
    // Check file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit.");
      return;
    }
    
    setError(null);
    setFile(selectedFile);
    
    // Create preview URL for image
    const fileReader = new FileReader();
    fileReader.onload = () => {
      setFilePreview(fileReader.result);
    };
    fileReader.readAsDataURL(selectedFile);
  };

  // Handle Google Drive selection
  const handleGoogleDriveSelect = () => {
    // This would typically integrate with Google Drive Picker API
    // For this example, we'll just show a message
    alert("Google Drive integration would open a picker here");
    
    // Simulating a file selection for demonstration
    // In a real implementation, this would come from the Google Drive API
    // setFile(...) and setFilePreview(...) would happen after selection
  };

  // Upload and process the image
  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setProcessingStatus("uploading");
    setProgress(0);

    try {
      // Include settings in the upload
      const uploadOptions = {
        quality: 75,
        preserve_format: preserveFormat,
        target_size_kb: targetSizeKb ? parseInt(targetSizeKb) : null
      };
      
      const { task_id } = await uploadImage(file, uploadOptions);
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
    link.download = "compressed_image" + resultUrl.substring(resultUrl.lastIndexOf("."));
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
    setFilePreview(null);
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
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Image Compression</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Reduce the file size of your images while maintaining quality. Perfect for websites, 
          email attachments, or saving storage space.
        </p>
      </motion.div>

      {/* Main content area */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* File Upload Section */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Upload Image</h2>
            
            {/* Settings Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showSettings 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
              <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${
                showSettings ? 'rotate-180' : ''
              }`} />
            </motion.button>
          </div>

          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-6 bg-gray-50 rounded-lg p-4 border"
              >
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Compression Settings</h3>
                
                <div className="space-y-4">
                  {/* Preserve Format Option */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="preserveFormat"
                      checked={preserveFormat}
                      onChange={(e) => setPreserveFormat(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="preserveFormat" className="ml-3 text-sm text-gray-700">
                      <span className="font-medium">Preserve Original Image Format</span>
                      <p className="text-gray-500 text-xs mt-1">
                        Keep the same file format (JPG, PNG, etc.) instead of auto-converting to optimal format
                      </p>
                    </label>
                  </div>

                  {/* Target Size Option */}
                  <div>
                    <label htmlFor="targetSize" className="block text-sm font-medium text-gray-700 mb-2">
                      Target Image Size (KB)
                    </label>
                    <input
                      type="number"
                      id="targetSize"
                      value={targetSizeKb}
                      onChange={(e) => setTargetSizeKb(e.target.value)}
                      placeholder="Leave empty for auto optimization"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      min="1"
                      max="10240"
                    />
                    <p className="text-gray-500 text-xs mt-1">
                      Specify a target file size. Leave empty for automatic optimization.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                  <div className="h-14 w-14 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <Upload className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG or WEBP (MAX. 10MB)
                  </p>
                </div>
              </motion.div>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
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
              {/* Preview */}
              <div className="w-full md:w-1/3 relative">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                  {filePreview ? (
                    <img 
                      src={filePreview} 
                      alt="Preview" 
                      className="max-h-full max-w-full object-contain" 
                    />
                  ) : (
                    <Image className="h-12 w-12 text-gray-400" />
                  )}
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
                      
                      {/* Settings Summary */}
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center text-xs text-gray-600">
                          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            preserveFormat ? 'bg-green-500' : 'bg-gray-400'
                          }`}></span>
                          Format: {preserveFormat ? 'Preserve original' : 'Auto-optimize'}
                        </div>
                        <div className="flex items-center text-xs text-gray-600">
                          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            targetSizeKb ? 'bg-blue-500' : 'bg-gray-400'
                          }`}></span>
                          Target size: {targetSizeKb ? `${targetSizeKb} KB` : 'Auto-optimize'}
                        </div>
                      </div>
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
                  <div className="flex space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleUpload}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center"
                    >
                      <ArrowDownToLine className="mr-2 h-4 w-4" />
                      Compress Image
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
                ) : (
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                      <motion.div
                        className="bg-blue-600 h-2.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                      ></motion.div>
                    </div>
                    
                    {/* Status Text */}
                    <div className="flex items-center">
                      {processingStatus === "uploading" && (
                        <>
                          <Loader2 className="animate-spin mr-2 h-4 w-4 text-blue-600" />
                          <span className="text-sm text-gray-700">Uploading image...</span>
                        </>
                      )}
                      
                      {processingStatus === "processing" && (
                        <>
                          <Loader2 className="animate-spin mr-2 h-4 w-4 text-blue-600" />
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
                          Download Compressed Image
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
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Why Compress Images?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold text-blue-600 mb-2">Faster Website Loading</h4>
              <p className="text-sm text-gray-600">
                Compressed images load faster, improving user experience and SEO rankings.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold text-blue-600 mb-2">Save Storage Space</h4>
              <p className="text-sm text-gray-600">
                Reduce file sizes by up to 80% without noticeable quality loss.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold text-blue-600 mb-2">Easier Sharing</h4>
              <p className="text-sm text-gray-600">
                Email attachments and social media uploads become quicker and more reliable.
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
        className="mt-12 bg-blue-50 rounded-xl shadow-sm p-6"
      >
        <h2 className="text-xl font-semibold text-center text-gray-800 mb-6">
          Advanced Compression Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Smart compression algorithm</h3>
              <p className="mt-1 text-sm text-gray-500">
                Our AI-powered compression preserves image quality where it matters most.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Multiple format support</h3>
              <p className="mt-1 text-sm text-gray-500">
                Works with JPG, PNG, WebP and automatically chooses the best format.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Metadata preservation</h3>
              <p className="mt-1 text-sm text-gray-500">
                Option to keep or remove EXIF data based on your privacy needs.
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
                Premium users can compress multiple images at once with our batch tool.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}