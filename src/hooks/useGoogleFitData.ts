import { useEffect, useState } from "react";
import { fetchGeneralFitData } from "../services/googleFit/fetchGeneralFitData";
import { fetchSleepData } from "../services/googleFit/fetchSleepData";
import { processFitData } from "../services/googleFit/processFitData";
import { processSleepData } from "../services/googleFit/processSleepData";
import { listGoogleFitDataSources } from "../services/googleFit/listDataSources";

type ProcessedFitData = ReturnType<typeof processFitData>;
type ProcessedSleepData = ReturnType<typeof processSleepData>;

const TOKEN_KEY = "googleFitToken";

export const useGoogleFitData = (initialToken: string | null) => {
  const [token, setToken] = useState<string | null>(() => {
    // Beim Start versuchen, das Token aus localStorage zu laden
    return initialToken || localStorage.getItem(TOKEN_KEY);
  });

  const [fitData, setFitData] = useState<ProcessedFitData | null>(null);
  const [sleepData, setSleepData] = useState<ProcessedSleepData | null>(null);

  useEffect(() => {
    if (!token) return;

    // Speichere das Token im localStorage für spätere Sitzungen
    localStorage.setItem(TOKEN_KEY, token);

    const loadData = async () => {
      try {
        const rawFit = await fetchGeneralFitData(token);
        const rawSleep = await fetchSleepData(token);

        console.log(" Rohdaten für Schlaf:", rawSleep);

        const processedFit = processFitData(rawFit);
        const processedSleep = processSleepData(rawSleep?.point || []);

        setFitData(processedFit);
        setSleepData(processedSleep);

        const dataSources = await listGoogleFitDataSources(token);
        const sleepSources = dataSources.dataSource.filter((src: any) =>
          src.dataType?.name === "com.google.sleep.segment"
        );
        console.log(" Sleep-DataSources gefunden:", sleepSources);

        console.log(" Verarbeitete Fit-Daten:", processedFit);
        console.log("Verarbeitete Schlafdaten:", processedSleep);
      } catch (err) {
        console.error("Fehler beim Abrufen oder Verarbeiten der Daten:", err);
      }
    };

    loadData();
  }, [token]);

  // Funktion zum manuell Ausloggen 
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setFitData(null);
    setSleepData(null);
  };

  return { fitData, sleepData, token, setToken, logout };
};
