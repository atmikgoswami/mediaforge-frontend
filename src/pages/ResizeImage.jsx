import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { resizeImage } from "../services/http/image";
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
  Maximize2,
  Lock,
  Unlock,
  Monitor,
  Smartphone,
  Tablet
} from "lucide-react";

export default function ResizeImage() {
  // File states
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [originalDimensions, setOriginalDimensions] = useState(null);
  const fileInputRef = useRef(null);
  
  // Resize settings
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(null);
  
  // Processing states
  const [isUploading, setIsUploading] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState(null); // 'uploading', 'processing', 'completed', 'error'
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState(null);

  // Progress polling
  const progressInterval = useRef(null);

  // Common preset sizes
  const presetSizes = [
    { name: "HD (1920×1080)", width: 1920, height: 1080, icon: Monitor },
    { name: "Instagram Square (1080×1080)", width: 1080, height: 1080, icon: Smartphone },
    { name: "Facebook Cover (820×312)", width: 820, height: 312, icon: Monitor },
    { name: "Twitter Header (1500×500)", width: 1500, height: 500, icon: Monitor },
    { name: "YouTube Thumbnail (1280×720)", width: 1280, height: 720, icon: Monitor },
    { name: "iPad (1024×768)", width: 1024, height: 768, icon: Tablet },
    { name: "iPhone (375×667)", width: 375, height: 667, icon: Smartphone },
    { name: "Web Banner (728×90)", width: 728, height: 90, icon: Monitor }
  ];

  // File size conversion
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Calculate aspect ratio
  const calculateAspectRatio = (w, h) => {
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(w, h);
    return { width: w / divisor, height: h / divisor };
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
    
    // Create preview URL and get dimensions
    const fileReader = new FileReader();
    fileReader.onload = () => {
      setFilePreview(fileReader.result);
      
      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        const dimensions = { width: img.width, height: img.height };
        setOriginalDimensions(dimensions);
        setWidth(img.width.toString());
        setHeight(img.height.toString());
        
        // Calculate and store aspect ratio
        const ratio = calculateAspectRatio(img.width, img.height);
        setAspectRatio(ratio);
      };
      img.src = fileReader.result;
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

  // Handle width change
  const handleWidthChange = (value) => {
    setWidth(value);
    
    if (maintainAspectRatio && aspectRatio && value && !isNaN(value)) {
      const newHeight = Math.round((parseInt(value) * aspectRatio.height) / aspectRatio.width);
      setHeight(newHeight.toString());
    }
  };

  // Handle height change
  const handleHeightChange = (value) => {
    setHeight(value);
    
    if (maintainAspectRatio && aspectRatio && value && !isNaN(value)) {
      const newWidth = Math.round((parseInt(value) * aspectRatio.width) / aspectRatio.height);
      setWidth(newWidth.toString());
    }
  };

  // Handle preset size selection
  const handlePresetSelect = (preset) => {
    setWidth(preset.width.toString());
    setHeight(preset.height.toString());
  };

  // Toggle aspect ratio lock
  const toggleAspectRatio = () => {
    setMaintainAspectRatio(!maintainAspectRatio);
  };

  // Reset to original dimensions
  const resetToOriginal = () => {
    if (originalDimensions) {
      setWidth(originalDimensions.width.toString());
      setHeight(originalDimensions.height.toString());
    }
  };

  // Upload and resize the image
  const handleResize = async () => {
    if (!file || !width || !height) return;

    const widthNum = parseInt(width);
    const heightNum = parseInt(height);
    
    if (isNaN(widthNum) || isNaN(heightNum) || widthNum <= 0 || heightNum <= 0) {
      setError("Please enter valid width and height values.");
      return;
    }

    setIsUploading(true);
    setProcessingStatus("uploading");
    setProgress(0);

    try {
      // Pass resize options to the upload function
      const resizeOptions = {
        width: widthNum,
        height: heightNum,
        maintainAspectRatio: maintainAspectRatio
      };
      
      const { task_id } = await resizeImage(file, resizeOptions);
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

  // Download resized image
  const downloadResult = async () => {
    if (!resultUrl) return;

    try {
      const response = await fetch(resultUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Generate filename with dimensions
      const originalName = file.name.split('.').slice(0, -1).join('.');
      const extension = file.name.split('.').pop();
      link.download = `${originalName}_${width}x${height}.${extension}`;
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
    setOriginalDimensions(null);
    setWidth("");
    setHeight("");
    setMaintainAspectRatio(true);
    setAspectRatio(null);
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

  const isValidDimensions = width && height && !isNaN(parseInt(width)) && !isNaN(parseInt(height)) && parseInt(width) > 0 && parseInt(height) > 0;

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Image Resizing</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Resize your images to specific dimensions or choose from popular preset sizes. 
          Perfect for social media, web optimization, or meeting specific requirements.
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
                  <div className="h-14 w-14 bg-green-50 rounded-full flex items-center justify-center mb-4">
                    <Upload className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, WebP, GIF (MAX. 10MB)
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
            <div className="space-y-6">
              {/* Image Preview and Current Info */}
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
                          {originalDimensions && (
                            <span> • {originalDimensions.width} × {originalDimensions.height} px</span>
                          )}
                        </p>
                        {aspectRatio && (
                          <p className="text-xs text-gray-400 mt-1">
                            Aspect ratio: {aspectRatio.width}:{aspectRatio.height}
                          </p>
                        )}
                      </div>
                      <button 
                        onClick={handleReset}
                        className="p-1.5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preset Sizes */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Popular Sizes</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {presetSizes.map((preset) => {
                    const IconComponent = preset.icon;
                    return (
                      <button
                        key={preset.name}
                        onClick={() => handlePresetSelect(preset)}
                        className="flex items-center p-2 text-xs bg-gray-50 hover:bg-green-50 hover:text-green-700 rounded-md transition-colors text-left"
                      >
                        <IconComponent className="h-3 w-3 mr-2 flex-shrink-0" />
                        <div>
                          <div className="font-medium">{preset.width}×{preset.height}</div>
                          <div className="text-gray-500 truncate">{preset.name.split('(')[0].trim()}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dimension Controls */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">Custom Dimensions</h3>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={resetToOriginal}
                      className="text-xs text-green-600 hover:text-green-700 font-medium"
                    >
                      Reset to Original
                    </button>
                    <button
                      onClick={toggleAspectRatio}
                      className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                        maintainAspectRatio
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {maintainAspectRatio ? <Lock size={12} /> : <Unlock size={12} />}
                      <span>Lock Ratio</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Width (px)
                    </label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => handleWidthChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Width"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Height (px)
                    </label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => handleHeightChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Height"
                      min="1"
                    />
                  </div>
                </div>

                {isValidDimensions && (
                  <div className="mt-3 text-xs text-gray-500">
                    New size will be: {parseInt(width)} × {parseInt(height)} pixels
                    {originalDimensions && (
                      <span className="ml-2">
                        ({Math.round((parseInt(width) * parseInt(height)) / (originalDimensions.width * originalDimensions.height) * 100)}% of original)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {!processingStatus ? (
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: isValidDimensions ? 1.03 : 1 }}
                    whileTap={{ scale: isValidDimensions ? 0.97 : 1 }}
                    onClick={handleResize}
                    disabled={!isValidDimensions}
                    className={`flex-1 py-2 px-4 rounded-md flex items-center justify-center transition-colors ${
                      isValidDimensions
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Maximize2 className="mr-2 h-4 w-4" />
                    Resize Image
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
                      className="bg-green-600 h-2.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    ></motion.div>
                  </div>
                  
                  {/* Status Text */}
                  <div className="flex items-center">
                    {processingStatus === "uploading" && (
                      <>
                        <Loader2 className="animate-spin mr-2 h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-700">Uploading image...</span>
                      </>
                    )}
                    
                    {processingStatus === "processing" && (
                      <>
                        <Loader2 className="animate-spin mr-2 h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-700">
                          Resizing to {width} × {height} pixels... {Math.round(progress)}%
                        </span>
                      </>
                    )}
                    
                    {processingStatus === "completed" && (
                      <>
                        <Check className="mr-2 h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-700">
                          Resize to {width} × {height} pixels completed!
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
                        Download Resized Image
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleReset}
                        className="bg-green-50 text-green-700 py-2 px-4 rounded-md hover:bg-green-100 flex items-center justify-center"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Start Over
                      </motion.button>
                    </div>
                  )}
                </div>
              )}

              {error && processingStatus !== "error" && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Information Section */}
        <div className="p-6 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Resizing Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold text-green-600 mb-2">Aspect Ratio Lock</h4>
              <p className="text-sm text-gray-600">
                Keep proportions intact to prevent distortion. Unlock for custom ratios.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold text-green-600 mb-2">Quality Preservation</h4>
              <p className="text-sm text-gray-600">
                Smart algorithms maintain quality when resizing, especially for upscaling.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold text-green-600 mb-2">Popular Presets</h4>
              <p className="text-sm text-gray-600">
                Quick access to common sizes for social media, devices, and web use.
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
        className="mt-12 bg-green-50 rounded-xl shadow-sm p-6"
      >
        <h2 className="text-xl font-semibold text-center text-gray-800 mb-6">
          Professional Resizing Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Smart upscaling</h3>
              <p className="mt-1 text-sm text-gray-500">
                AI-powered algorithms enhance image quality when enlarging images.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Aspect ratio protection</h3>
              <p className="mt-1 text-sm text-gray-500">
                Automatically maintain proportions or unlock for creative freedom.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Popular size presets</h3>
              <p className="mt-1 text-sm text-gray-500">
                One-click resizing for social media, devices, and web platforms.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Batch resizing</h3>
              <p className="mt-1 text-sm text-gray-500">
                Premium users can resize multiple images to the same dimensions at once.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}