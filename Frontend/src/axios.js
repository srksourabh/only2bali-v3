// src/axios.js
import axios from "axios";

// Create React App exposes env vars through process.env and requires the
// REACT_APP_ prefix. import.meta.env is a Vite-only feature and resolves to
// undefined under react-scripts, which previously left baseURL undefined.
const baseURL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://pybackend-eeamcqf4evb6hacn.centralindia-01.azurewebsites.net/";

const api = axios.create({
  baseURL: baseURL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to handle errors globally
api.interceptors.response.use(
  response => response,
  error => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export default api;
