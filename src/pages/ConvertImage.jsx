import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { convertImage } from "../services/http/image";
import { fetchProgress } from "../services/http/common";
import { 
  Upload, 
  ArrowDownToLine, 
  Image as ImageIcon, 
  X, 
  Check, 
  Loader2, 
  Download, 
  RefreshCw,
  CloudUpload,
  FileType,
  ChevronDown
} from "lucide-react";

export default function ConvertImage() {
  // File states
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [inputFormat, setInputFormat] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  
  // Processing states
  const [isUploading, setIsUploading] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState(null); // 'uploading', 'processing', 'completed', 'error'
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState(null);

  // Progress polling
  const progressInterval = useRef(null);

  // Available formats based on input
  const getAvailableFormats = (inputType) => {
    const allFormats = [
      { value: 'jpg', label: 'JPG', description: 'Best for photos with many colors' },
      { value: 'png', label: 'PNG', description: 'Best for images with transparency' },
      { value: 'webp', label: 'WebP', description: 'Modern format with excellent compression' },
      { value: 'bmp', label: 'BMP', description: 'Uncompressed bitmap format' },
      { value: 'tiff', label: 'TIFF', description: 'High-quality format for professional use' },
      { value: 'gif', label: 'GIF', description: 'Best for simple animations' },
      { value: 'ico', label: 'ICO', description: 'Icon format for websites' },
      { value: 'pdf', label: 'PDF', description: 'Document format' }
    ];

    // Filter out the current input format
    return allFormats.filter(format => format.value !== inputType);
  };

  // Get recommended formats based on input
  const getRecommendedFormats = (inputType) => {
    const recommendations = {
      'jpg': ['webp', 'png'],
      'jpeg': ['webp', 'png'],
      'png': ['webp', 'jpg'],
      'webp': ['jpg', 'png'],
      'bmp': ['jpg', 'png', 'webp'],
      'tiff': ['jpg', 'png', 'webp'],
      'gif': ['png', 'webp', 'jpg']
    };

    return recommendations[inputType] || ['jpg', 'png', 'webp'];
  };

  // File size conversion
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Get file extension from filename
  const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase();
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
    
    // Detect input format
    const extension = getFileExtension(selectedFile.name);
    const normalizedExtension = extension === 'jpeg' ? 'jpg' : extension;
    setInputFormat(normalizedExtension);
    setSelectedFormat(null); // Reset selected format when new file is uploaded
    
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

  // Handle format selection
  const handleFormatSelect = (format) => {
    setSelectedFormat(format);
    setShowFormatDropdown(false);
  };

  // Upload and convert the image
  const handleConvert = async () => {
    if (!file || !selectedFormat) return;

    setIsUploading(true);
    setProcessingStatus("uploading");
    setProgress(0);

    try {
      // In a real implementation, you'd pass the target format to the API
      const { task_id } = await convertImage(file, { targetFormat: selectedFormat });
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

  // Download converted image
  const downloadResult = async () => {
    if (!resultUrl || !selectedFormat) return;

    try {
      const response = await fetch(resultUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Generate filename with new extension
      const originalName = file.name.split('.').slice(0, -1).join('.');
      link.download = `${originalName}_converted.${selectedFormat}`;
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
    setInputFormat(null);
    setSelectedFormat(null);
    setTaskId(null);
    setProgress(0);
    setProcessingStatus(null);
    setResultUrl(null);
    setError(null);
    setIsUploading(false);
    setShowFormatDropdown(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowFormatDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Clean up interval on component unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  const availableFormats = inputFormat ? getAvailableFormats(inputFormat) : [];
  const recommendedFormats = inputFormat ? getRecommendedFormats(inputFormat) : [];

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Image Format Conversion</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Convert your images between different formats. Choose the perfect format for your needs - 
          whether it's web optimization, transparency support, or compatibility requirements.
        </p>
      </motion.div>

      {/* Main content area */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* File Upload Section */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload Image</h2>

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
                  <div className="h-14 w-14 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                    <Upload className="h-6 w-6 text-purple-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, WebP, BMP, TIFF, GIF (MAX. 10MB)
                  </p>
                </div>
              </motion.div>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
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
            <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6">
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
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  )}
                </div>
              </div>

              {/* File Details and Format Selection */}
              <div className="w-full md:w-2/3">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 break-all">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatFileSize(file.size)} • {inputFormat?.toUpperCase()} format
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

                {/* Format Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Convert to format:
                  </label>
                  
                  {/* Recommended formats */}
                  {recommendedFormats.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-2">Recommended:</p>
                      <div className="flex flex-wrap gap-2">
                        {recommendedFormats.map((formatValue) => {
                          const format = availableFormats.find(f => f.value === formatValue);
                          if (!format) return null;
                          return (
                            <button
                              key={format.value}
                              onClick={() => handleFormatSelect(format.value)}
                              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                                selectedFormat === format.value
                                  ? 'bg-purple-600 text-white border-purple-600'
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-purple-50 hover:border-purple-300'
                              }`}
                            >
                              {format.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Format dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-md shadow-sm text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <div className="flex items-center">
                        <FileType className="mr-3 h-5 w-5 text-gray-400" />
                        <span className="text-sm">
                          {selectedFormat ? 
                            availableFormats.find(f => f.value === selectedFormat)?.label : 
                            'Select output format'
                          }
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>

                    {showFormatDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg"
                      >
                        <div className="py-1 max-h-60 overflow-auto">
                          {availableFormats.map((format) => (
                            <button
                              key={format.value}
                              onClick={() => handleFormatSelect(format.value)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {format.label}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {format.description}
                                  </p>
                                </div>
                                {recommendedFormats.includes(format.value) && (
                                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                    Recommended
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {selectedFormat && (
                    <p className="mt-2 text-xs text-gray-500">
                      {availableFormats.find(f => f.value === selectedFormat)?.description}
                    </p>
                  )}
                </div>

                {!processingStatus ? (
                  <div className="flex space-x-3">
                    <motion.button
                      whileHover={{ scale: selectedFormat ? 1.03 : 1 }}
                      whileTap={{ scale: selectedFormat ? 0.97 : 1 }}
                      onClick={handleConvert}
                      disabled={!selectedFormat}
                      className={`flex-1 py-2 px-4 rounded-md flex items-center justify-center transition-colors ${
                        selectedFormat
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <ArrowDownToLine className="mr-2 h-4 w-4" />
                      Convert Image
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
                        className="bg-purple-600 h-2.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                      ></motion.div>
                    </div>
                    
                    {/* Status Text */}
                    <div className="flex items-center">
                      {processingStatus === "uploading" && (
                        <>
                          <Loader2 className="animate-spin mr-2 h-4 w-4 text-purple-600" />
                          <span className="text-sm text-gray-700">Uploading image...</span>
                        </>
                      )}
                      
                      {processingStatus === "processing" && (
                        <>
                          <Loader2 className="animate-spin mr-2 h-4 w-4 text-purple-600" />
                          <span className="text-sm text-gray-700">
                            Converting to {selectedFormat?.toUpperCase()}... {Math.round(progress)}%
                          </span>
                        </>
                      )}
                      
                      {processingStatus === "completed" && (
                        <>
                          <Check className="mr-2 h-4 w-4 text-green-600" />
                          <span className="text-sm text-gray-700">
                            Conversion to {selectedFormat?.toUpperCase()} completed!
                          </span>
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
                        <motion.button
                          onClick={downloadResult}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 flex items-center justify-center"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download {selectedFormat?.toUpperCase()} Image
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={handleReset}
                          className="bg-purple-50 text-purple-700 py-2 px-4 rounded-md hover:bg-purple-100 flex items-center justify-center"
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
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Format Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold text-purple-600 mb-2">JPG/JPEG</h4>
              <p className="text-sm text-gray-600">
                Best for photographs and images with many colors. Smaller file sizes but no transparency.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold text-purple-600 mb-2">PNG</h4>
              <p className="text-sm text-gray-600">
                Perfect for images with transparency, logos, and graphics with sharp edges.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold text-purple-600 mb-2">WebP</h4>
              <p className="text-sm text-gray-600">
                Modern format with excellent compression and quality. Great for web use.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold text-purple-600 mb-2">TIFF</h4>
              <p className="text-sm text-gray-600">
                High-quality format for professional photography and printing.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold text-purple-600 mb-2">BMP</h4>
              <p className="text-sm text-gray-600">
                Uncompressed format with large file sizes but perfect quality.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold text-purple-600 mb-2">ICO</h4>
              <p className="text-sm text-gray-600">
                Icon format for websites, favicons, and desktop applications.
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
        className="mt-12 bg-purple-50 rounded-xl shadow-sm p-6"
      >
        <h2 className="text-xl font-semibold text-center text-gray-800 mb-6">
          Smart Conversion Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Smart format recommendations</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get intelligent suggestions based on your input format and use case.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Quality preservation</h3>
              <p className="mt-1 text-sm text-gray-500">
                Advanced algorithms ensure maximum quality retention during conversion.
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
                Convert between all major image formats including modern WebP and legacy formats.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Batch conversion</h3>
              <p className="mt-1 text-sm text-gray-500">
                Premium users can convert multiple images to different formats simultaneously.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}