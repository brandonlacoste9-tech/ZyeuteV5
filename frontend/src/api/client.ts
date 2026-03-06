import axios from "axios";
import { supabase } from "@/lib/supabase";

/**
 * Centalisés Axios client for Zyeuté
 */
export const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to every request
apiClient.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  return config;
});

// Add response error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error(
      `[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`,
      error.response?.data || error.message,
    );
    return Promise.reject(error.response?.data || error);
  },
);
