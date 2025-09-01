export const listGoogleFitDataSources = async (token: string) => {
  const response = await fetch("https://www.googleapis.com/fitness/v1/users/me/dataSources", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  console.log("📦 Verfügbare Google Fit DataSources:", data);
  return data;
};
