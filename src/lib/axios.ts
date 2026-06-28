import Axios, { AxiosRequestConfig } from 'axios';

// Use environment variable for API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.georgesheppard.dev';

export const AXIOS_INSTANCE = Axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Always send cookies for auth
});

export const axiosInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const source = Axios.CancelToken.source();
  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data);

  // @ts-expect-error - Adding cancel method to promise
  promise.cancel = () => {
    source.cancel('Query was cancelled');
  };

  return promise;
};
