import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
export const USE_MOCK = false;

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("jbit_auth_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors uniformly and unwrap response envelope
apiClient.interceptors.response.use(
  (response) => {
    // If backend returned standard envelope { success: true, data: T, message: "..." }, unwrap it
    if (
      response.data &&
      typeof response.data === "object" &&
      response.data.success === true &&
      "data" in response.data
    ) {
      return {
        ...response,
        data: response.data.data,
      };
    }
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as { message?: string };
      
      switch (status) {
        case 401:
          if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
            localStorage.removeItem("jbit_auth_token");
            localStorage.removeItem("jbit_auth_user");
            window.location.href = "/login?expired=true";
          }
          break;
        case 403:
          if (typeof window !== "undefined") {
            window.location.href = "/403";
          }
          break;
        case 404:
          console.warn("Resource not found:", error.config?.url);
          break;
        case 422:
          console.warn("Business validation error:", data.message);
          break;
        case 500:
          console.error("Internal Server Error:", data.message || "A server error occurred");
          break;
      }
    }
    return Promise.reject(error);
  }
);
