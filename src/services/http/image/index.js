import axios from "axios";
import { CONST } from "../../../config";

export const uploadImage = async (file, quality = 75) => {
  const formData = new FormData();
  formData.append('upload', file);
  formData.append('quality', quality); // Include default or passed quality

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
