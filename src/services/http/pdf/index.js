import axios from "axios";
import { CONST } from "../../../config";

export const compressPDF = async (file, compressionLevel = "medium") => {
  const formData = new FormData();
  formData.append('upload', file);
  formData.append('compression_level', compressionLevel);

  const response = await axios.post(CONST.uri.pdf.COMPRESS_PDF, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data; // Expected: { taskId: "..." }
};

export const mergePDF = async (orderedFiles) => {
  const formData = new FormData();
  
  // Append each file with the key "files" to match FastAPI's expected list[UploadFile]
  orderedFiles.forEach((file) => {
    formData.append('files', file);
  });

  const response = await axios.post(CONST.uri.pdf.MERGE_PDF, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data; // Expected: { task_id: "..." }
};

export const extractPDF = async (file, startPage, endPage) => {
  const formData = new FormData();
  formData.append('upload', file);
  formData.append('start_page', startPage);
  formData.append('end_page', endPage);

  const response = await axios.post(CONST.uri.pdf.EXTRACT_PDF, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data; // Expected: { taskId: "..." }
};

