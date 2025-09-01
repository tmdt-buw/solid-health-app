// fetchGeneralFitData.ts
export const fetchGeneralFitData = async (token: string) => {
  const now = Date.now();
  const startTimeMillis = now - 90 * 24 * 60 * 60 * 1000;
  const endTimeMillis = now;

  const body = {
    aggregateBy: [
      { dataTypeName: "com.google.step_count.delta" },
      { dataTypeName: "com.google.heart_rate.bpm" },
      { dataTypeName: "com.google.calories.expended" },
      { dataTypeName: "com.google.weight" },
    ],
    bucketByTime: { durationMillis: 24 * 60 * 60 * 1000 },
    startTimeMillis,
    endTimeMillis,
  };

  const res = await fetch(
    "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  let data: any = null;
  try { data = await res.json(); } catch { /* ignore */ }

  if (!res.ok) {
    console.warn("Google Fit aggregate error:", res.status, data);
    return { bucket: [] };           
  }
  if (data?.error) {
    console.warn("Google Fit aggregate error payload:", data.error);
    return { bucket: [] };
  }
  if (!Array.isArray(data?.bucket)) {
    return { bucket: [] };
  }
  return data;
};
