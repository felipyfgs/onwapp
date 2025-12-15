import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const apiKey = API_KEY || localStorage.getItem('api_key');
        if (apiKey) {
          config.headers['Authorization'] = apiKey;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        // Silently handle expected errors or empty responses
        if (error.response?.status === 404) {
          return Promise.reject(error);
        }

        // Only log if there's actual error data
        const errorData = error.response?.data || error.message;
        if (errorData && Object.keys(errorData).length > 0) {
           // Optional: Uncomment for debugging only
           // console.error('API Error:', errorData);
        }
        
        return Promise.reject(error);
      }
    );
  }

  get axios() {
    return this.instance;
  }
}

export const apiClient = new ApiClient().axios;
export default apiClient;
