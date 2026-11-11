import { useEffect } from "react";

export const useLoadGapi = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
    };
    script.onerror = () => {
      console.error("Failed to load Google API script");
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);
};
