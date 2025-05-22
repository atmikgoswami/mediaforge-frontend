import { env } from "./config"

export const uri = {
  common: {
    GET_PROGRESS: env.API_SERVER + "/progress",
  },
  image: {
    COMPRESS_IMAGE: env.API_SERVER + "/image/compress",
    CONVERT_IMAGE: env.API_SERVER + "/image/convert",
    RESIZE_IMAGE: env.API_SERVER + "/image/resize",
  },
  pdf: {
    COMPRESS_PDF: env.API_SERVER + "/pdf/compress",
    EXTRACT_PDF: env.API_SERVER + "/pdf/extract",
    MERGE_PDF: env.API_SERVER + "/pdf/merge",
  }
}
