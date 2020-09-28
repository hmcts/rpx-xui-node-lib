import { getLogger, XuiLogger } from '../util'
import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'

const logger: XuiLogger = getLogger('common:http')

export function requestInterceptor(request: AxiosRequestConfig): AxiosRequestConfig {
    logger.info(`${request.method?.toUpperCase()} to ${request.url}`)
    return request
}

export function successInterceptor(response: AxiosResponse): AxiosResponse {
    logger.info(`Success on ${response.config.method?.toUpperCase()} to ${response.config.url}`)
    return response
}

export function errorInterceptor(error: AxiosError): Promise<AxiosError> {
    logger.error(error)
    return Promise.reject(error.response)
}
