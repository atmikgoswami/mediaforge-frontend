export function getAccessToken() {
  return new Promise((resolve, reject) => {
    window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GDRIVE_CLIENT_ID,
      scope: "https://www.googleapis.com/auth/drive.readonly",
      callback: (tokenResponse) => {
        if (tokenResponse?.access_token) {
          resolve(tokenResponse.access_token);
        } else {
          reject("Failed to get token");
        }
      },
    }).requestAccessToken();
  });
}