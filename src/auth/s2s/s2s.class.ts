import events from 'events'
import { NextFunction, Request, RequestHandler, Response, Router } from 'express'
// eslint-disable-next-line @typescript-eslint/camelcase
import jwt_decode from 'jwt-decode'
import { totp } from 'node-otp'
import { http } from '../../http/http'
import { DecodedJWT } from './decodedJwt.interface'
import { S2S } from './s2s.constants'
import { S2SConfig } from './s2sConfig.interface'
import { S2SToken } from './s2sToken.interface'

// TODO: To be replaced with a proper logging library
const logger = console

// Cache of S2S tokens, indexed by microservice name
const cache: { [key: string]: S2SToken } = {}

export class S2SAuth extends events.EventEmitter {
    protected readonly router = Router({ mergeParams: true })

    protected s2sConfig: S2SConfig = {
        microservice: '',
        s2sEndpointUrl: '',
        s2sSecret: '',
    }

    constructor() {
        super()
    }

    /**
     * This must be called with a suitable configuration before attempting to use the middleware, or else it will not
     * have valid parameter values to generate the S2S token.
     */
    public configure(s2sConfig: S2SConfig): RequestHandler {
        this.s2sConfig = s2sConfig
        this.router.use(this.s2sHandler)

        return this.router
    }

    public async s2sHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const token = await this.serviceTokenGenerator()

            if (token) {
                logger.info('Adding S2S token to request headers')
                req.headers.ServiceAuthorization = `Bearer ${token}`

                // If there are no listeners for a success event from this emitter, just return this middleware using
                // next(), else emit a success event with the S2S token
                if (!this.listenerCount(S2S.EVENT.AUTHENTICATE_SUCCESS)) {
                    logger.log(`S2SAuth: no listener count: ${S2S.EVENT.AUTHENTICATE_SUCCESS}`)
                    return next()
                } else {
                    this.emit(S2S.EVENT.AUTHENTICATE_SUCCESS, token, req, res, next)
                    return
                }
            }
        } catch (error) {
            logger.log('S2SAuth error:', error)
            next(error)
        }
    }

    public validateCache(): boolean {
        logger.info('Validating S2S token cache')
        const currentTime = Math.floor(Date.now() / 1000)
        if (!cache[this.s2sConfig.microservice]) {
            return false
        }
        return currentTime < cache[this.s2sConfig.microservice].expiresAt
    }

    public getToken(): S2SToken {
        return cache[this.s2sConfig.microservice]
    }

    private async generateToken(): Promise<string> {
        logger.info('Getting new S2S token')
        const token = await this.postS2SLease()

        const tokenData: DecodedJWT = jwt_decode(token)

        cache[this.s2sConfig.microservice] = {
            expiresAt: tokenData.exp,
            token,
        } as S2SToken

        return token
    }

    private async postS2SLease(): Promise<string> {
        const oneTimePassword = totp({ secret: this.s2sConfig.s2sSecret })

        logger.info('Requesting S2S token for microservice: ', this.s2sConfig.microservice)

        const request = await http.post(`${this.s2sConfig.s2sEndpointUrl}`, {
            microservice: this.s2sConfig.microservice,
            oneTimePassword,
        })

        return request.data
    }

    public async serviceTokenGenerator(): Promise<string> {
        if (this.validateCache()) {
            logger.info('Getting cached S2S token')
            const tokenData = this.getToken()
            return tokenData.token
        } else {
            return await this.generateToken()
        }
    }
}

export default new S2SAuth()
