import { totp } from 'node-otp'
import { http } from '../../http/http'
import { S2SConfig } from './s2sConfig.interface'

// TODO: To be replaced with a proper logging library
const logger = console

export async function postS2SLease(s2sConfig: S2SConfig): Promise<string> {
    const oneTimePassword = totp({ secret: s2sConfig.s2sSecret })

    logger.info('generating from secret: ', s2sConfig.s2sSecret, s2sConfig.microservice, oneTimePassword)

    const request = await http.post(`${s2sConfig.s2sEndpointUrl}`, {
        microservice: s2sConfig.microservice,
        oneTimePassword,
    })

    return request.data
}
