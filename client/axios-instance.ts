import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

interface RetryConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;

const isRetryable = (error: AxiosError): boolean => {
  if (error.response) {
    // Retry on rate limiting or server errors; never on client errors
    return error.response.status === 429 || error.response.status >= 500;
  }
  // No response means a network error — always retry
  return true;
};

const getBackoffDelay = (attempt: number): number => {
  const exponentialDelay = BASE_DELAY_MS * Math.pow(2, attempt);
  // ±25% jitter to avoid thundering herd
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
  return Math.min(exponentialDelay + jitter, MAX_DELAY_MS);
};

axios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;

    if (!config || !isRetryable(error)) {
      return Promise.reject(error);
    }

    config._retryCount = (config._retryCount ?? 0) + 1;

    if (config._retryCount > MAX_RETRIES) {
      return Promise.reject(error);
    }

    await new Promise((resolve) =>
      setTimeout(resolve, getBackoffDelay(config._retryCount! - 1))
    );

    return axios(config);
  }
);
