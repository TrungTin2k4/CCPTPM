import axios from 'axios'

const baseURL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '')

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const payload = error.response?.data

    return Promise.reject({
      status: error.response?.status ?? 500,
      message: payload?.message ?? error.message ?? 'Request failed',
      data: payload?.data ?? null,
    })
  },
)

export function setAuthToken(token) {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`
    return
  }

  delete apiClient.defaults.headers.common.Authorization
}

export function unwrapData(response) {
  return response.data?.data ?? null
}
