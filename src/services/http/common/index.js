import axios from "axios";
import { CONST } from "../../../config";

export const fetchProgress = async (taskId) => {
  console.log(taskId);
  const response = await axios.get(`${CONST.uri.common.GET_PROGRESS}/${taskId}`);
  return response.data; // Expecting { progress: number, resultUrl?: string }
};