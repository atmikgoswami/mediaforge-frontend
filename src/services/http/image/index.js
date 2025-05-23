import axios from "axios";
import { CONST } from "../../../config";

export const uploadImage = async (file, uploadOptions) => {
  const formData = new FormData();
  formData.append('upload', file);
  formData.append('quality', uploadOptions.quality); 
  formData.append('preserve_format', uploadOptions.preserve_format); 
  if(uploadOptions.target_size_kb){
    formData.append('target_size_kb', uploadOptions.target_size_kb); 
  }

  const response = await axios.post(CONST.uri.image.COMPRESS_IMAGE, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  console.log(response.data);
  return response.data; // Expected: { taskId: "..." }
};

export const convertImage = async (file, {targetFormat}) => {
  const formData = new FormData();
  formData.append('upload', file);
  formData.append('target_format', targetFormat); 

  const response = await axios.post(CONST.uri.image.CONVERT_IMAGE, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data; // Expected: { taskId: "..." }
};

export const resizeImage = async (file, resizeOptions) => {
  const formData = new FormData();
  formData.append('upload', file);
  formData.append('width', resizeOptions.width); 
  formData.append('height', resizeOptions.height); 
  formData.append('maintain_aspect_ratio', resizeOptions.maintainAspectRatio); 

  const response = await axios.post(CONST.uri.image.RESIZE_IMAGE, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data; // Expected: { taskId: "..." }
};
