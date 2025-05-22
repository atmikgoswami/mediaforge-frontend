import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { mergePDF } from "../services/http/pdf";
import { fetchProgress } from "../services/http/common";
import { 
  Upload, 
  FileText, 
  X, 
  Check, 
  Loader2, 
  Download, 
  RefreshCw,
  CloudUpload,
  GripVertical,
  Plus,
  ArrowUpDown,
  Combine,
  Info
} from "lucide-react";

export default function MergePDF() {
  // File states
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  
  // Processing states
  const [isUploading, setIsUploading] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState(null); // 'uploading', 'processing', 'completed', 'error'
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState(null);
  
  // Drag and drop states
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  
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

  // Handle file selection (multiple files)
  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    
    if (selectedFiles.length === 0) return;
    
    // Validate each file
    const validFiles = [];
    let hasErrors = false;
    
    selectedFiles.forEach(file => {
      // Check file size (25MB max per file)
      if (file.size > 25 * 1024 * 1024) {
        setError(`File "${file.name}" exceeds 25MB limit.`);
        hasErrors = true;
        return;
      }
      
      // Check file type
      if (file.type !== "application/pdf") {
        setError(`File "${file.name}" is not a PDF.`);
        hasErrors = true;
        return;
      }
      
      validFiles.push({
        id: Math.random().toString(36).substr(2, 9),
        file: file,
        name: file.name,
        size: file.size
      });
    });
    
    if (!hasErrors) {
      setError(null);
      setFiles(prevFiles => [...prevFiles, ...validFiles]);
    }
  };

  // Handle Google Drive selection
  const handleGoogleDriveSelect = () => {
    // This would typically integrate with Google Drive Picker API
    alert("Google Drive integration would open a picker here");
  };

  // Remove a specific file
  const removeFile = (fileId) => {
    setFiles(files.filter(file => file.id !== fileId));
    if (files.length === 1) {
      setError(null);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newFiles = [...files];
    const draggedFile = newFiles[draggedIndex];
    
    // Remove the dragged file from its current position
    newFiles.splice(draggedIndex, 1);
    
    // Insert it at the new position
    const insertIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newFiles.splice(insertIndex, 0, draggedFile);
    
    setFiles(newFiles);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Move file up in the list
  const moveFileUp = (index) => {
    if (index === 0) return;
    const newFiles = [...files];
    [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
    setFiles(newFiles);
  };

  // Move file down in the list
  const moveFileDown = (index) => {
    if (index === files.length - 1) return;
    const newFiles = [...files];
    [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
    setFiles(newFiles);
  };

  // Upload and process the PDFs
  const handleUpload = async () => {
    if (files.length < 2) {
      setError("Please select at least 2 PDF files to merge.");
      return;
    }

    setIsUploading(true);
    setProcessingStatus("uploading");
    setProgress(0);

    try {
      // Send files in the current order
      const orderedFiles = files.map(fileObj => fileObj.file);
      const { task_id } = await mergePDF(orderedFiles);
      setTaskId(task_id);
      setProcessingStatus("processing");
      startProgressPolling(task_id);
    } catch (err) {
      setError("Failed to upload PDFs. Please try again.");
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

  // Download result
  const downloadResult = async () => {
    if (!resultUrl) return;

    try {
      const response = await fetch(resultUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "merged_pdf" + resultUrl.substring(resultUrl.lastIndexOf("."));
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
    
    setFiles([]);
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

  // Calculate total file size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-4">PDF Merger</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Combine multiple PDF documents into a single file. Upload your PDFs, arrange them in your preferred order, 
          and merge them seamlessly.
        </p>
      </motion.div>

      {/* Main content area */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* File Upload Section */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Upload PDFs</h2>
            {files.length > 0 && (
              <span className="text-sm text-gray-500">
                {files.length} file{files.length !== 1 ? 's' : ''} • {formatFileSize(totalSize)}
              </span>
            )}
          </div>

          {files.length === 0 ? (
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
                    Multiple PDF files (MAX. 25MB each)
                  </p>
                </div>
              </motion.div>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="application/pdf"
                multiple
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
            <div className="space-y-4">
              {/* Add more files button */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="flex items-center px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add More PDFs
                </button>
                <div className="flex items-center text-sm text-gray-500">
                  <ArrowUpDown className="h-4 w-4 mr-1" />
                  Drag to reorder
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="application/pdf"
                multiple
                onChange={handleFileChange}
              />

              {/* File List */}
              <div className="space-y-2">
                {files.map((fileObj, index) => (
                  <motion.div
                    key={fileObj.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`bg-gray-50 rounded-lg p-4 border-2 transition-all ${
                      dragOverIndex === index ? 'border-blue-300 bg-blue-50' : 'border-transparent'
                    } ${draggedIndex === index ? 'opacity-50' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Drag Handle */}
                      <div className="cursor-move text-gray-400 hover:text-gray-600">
                        <GripVertical className="h-5 w-5" />
                      </div>

                      {/* Order Number */}
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>

                      {/* PDF Icon */}
                      <div className="flex-shrink-0">
                        <FileText className="h-8 w-8 text-red-500" />
                      </div>

                      {/* File Info */}
                      <div className="flex-grow min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {fileObj.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(fileObj.size)}
                        </p>
                      </div>

                      {/* Move Buttons */}
                      <div className="flex space-x-1">
                        <button
                          onClick={() => moveFileUp(index)}
                          disabled={index === 0}
                          className="p-1.5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowUpDown className="h-3 w-3 rotate-180" />
                        </button>
                        <button
                          onClick={() => moveFileDown(index)}
                          disabled={index === files.length - 1}
                          className="p-1.5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button 
                        onClick={() => removeFile(fileObj.id)}
                        className="p-1.5 rounded-full bg-red-100 hover:bg-red-200 text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Processing Status */}
              {!processingStatus ? (
                <div className="flex space-x-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleUpload}
                    disabled={files.length < 2}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Combine className="mr-2 h-4 w-4" />
                    Merge PDFs ({files.length} files)
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleReset}
                    className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
                  >
                    Clear All
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-4 pt-4">
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
                        <span className="text-sm text-gray-700">Uploading PDFs...</span>
                      </>
                    )}
                    
                    {processingStatus === "processing" && (
                      <>
                        <Loader2 className="animate-spin mr-2 h-4 w-4 text-blue-600" />
                        <span className="text-sm text-gray-700">
                          Merging PDFs... {Math.round(progress)}%
                        </span>
                      </>
                    )}
                    
                    {processingStatus === "completed" && (
                      <>
                        <Check className="mr-2 h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-700">Merge completed successfully!</span>
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
                        Download Merged PDF
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

              {error && files.length > 0 && !processingStatus && (
                <div className="mt-4 text-sm text-red-600">
                  {error}
                </div>
              )}

              {files.length < 2 && files.length > 0 && (
                <div className="mt-4 flex items-center text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                  <Info className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Add at least one more PDF to enable merging.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Information Section */}
        <div className="p-6 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">How PDF Merging Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold text-blue-600 mb-2">Smart Page Organization</h4>
              <p className="text-sm text-gray-600">
                Pages are combined in the exact order you specify, maintaining original formatting and structure.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold text-blue-600 mb-2">Preserve Metadata</h4>
              <p className="text-sm text-gray-600">
                Document properties, bookmarks, and interactive elements are preserved when possible.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold text-blue-600 mb-2">Quality Maintained</h4>
              <p className="text-sm text-gray-600">
                No quality loss during merging - your documents remain crisp and professional.
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
          PDF Merging Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Drag & drop reordering</h3>
              <p className="mt-1 text-sm text-gray-500">
                Easily rearrange your PDFs by dragging them into the desired order before merging.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Multiple file support</h3>
              <p className="mt-1 text-sm text-gray-500">
                Combine unlimited PDFs into a single document with our efficient merging engine.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Bookmark preservation</h3>
              <p className="mt-1 text-sm text-gray-500">
                Original bookmarks and navigation structure are maintained in the merged document.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Form field compatibility</h3>
              <p className="mt-1 text-sm text-gray-500">
                Interactive forms and fillable fields remain functional in the merged PDF.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}