export const API_BASE_URL = `${
  import.meta.env.VITE_API_URL || "http://localhost:8000"
}/api/v1`;

export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
};
