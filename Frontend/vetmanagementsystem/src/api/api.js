import axios from "axios";

const backendUrl = (
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.REACT_APP_BACKEND_URL ||
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const API = axios.create({
  baseURL: `${backendUrl}/api/`,
  withCredentials: true,
  timeout: 60000,
});

let accessToken = localStorage.getItem("access_token") || null;
let refreshToken = localStorage.getItem("refresh_token") || null;

API.interceptors.request.use((config) => {
  accessToken = localStorage.getItem("access_token") || null;
  refreshToken = localStorage.getItem("refresh_token") || null;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if ((error.code === "ECONNABORTED" || error.message === "Network Error") && !originalRequest?._retryNetwork) {
      originalRequest._retryNetwork = true;
      return API(originalRequest);
    }

    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      refreshToken = localStorage.getItem("refresh_token");

      if (!refreshToken) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${backendUrl}/api/token/refresh/`, {
          refresh: refreshToken,
        });

        accessToken = response.data.access;
        localStorage.setItem("access_token", accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const getPatients = () => API.get("patients/");
export const getClients = () => API.get("clients/");
export const getAppointments = () => API.get("appointments/");
export const getVitals = () => API.get("vitals/");
export const getMedications = () => API.get("medications/");
export const getDocuments = () => API.get("documents/");
export const getTreatments = () => API.get("treatments/");
export const getDashboard = () => API.get("dashboard/");
export const getOverview = () => API.get("overview-customer/");

export function setTokens(access, refresh) {
  accessToken = access || null;
  refreshToken = refresh || null;

  if (accessToken) localStorage.setItem("access_token", accessToken);
  if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export default API;
