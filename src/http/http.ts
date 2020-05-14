import axios, { AxiosInstance } from 'axios'
export const http: AxiosInstance = axios.create({})

axios.defaults.headers.common['Content-Type'] = 'application/json'
