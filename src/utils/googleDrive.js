export const downloadDriveFile = async (fileId, accessToken) => {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Google Drive file download failed");
  }

  return await response.blob();
};

