export const fetchSleepData = async (token: string) => {
  const now = Date.now();
  const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;
  const datasetId = `${ninetyDaysAgo * 1e6}-${now * 1e6}`;

  const rawSleepSourceId = encodeURIComponent("raw:com.google.sleep.segment:com.pubu.dafit:");

  const response = await fetch(
    `https://www.googleapis.com/fitness/v1/users/me/dataSources/${rawSleepSourceId}/datasets/${datasetId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();
  console.log("🛌 Schlafdaten aus Pubu:", data);
  return data;
};
