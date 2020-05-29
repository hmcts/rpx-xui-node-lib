import events from 'events'
import { NextFunction, Request, RequestHandler, Response, Router } from 'express'
// eslint-disable-next-line @typescript-eslint/camelcase
import jwt_decode from 'jwt-decode'
import { DecodedJWT } from './decodedJwt.interface'
import { S2S } from './s2s.constants'
import { S2SConfig } from './s2sConfig.interface'
import { S2SToken } from './s2sToken.interface'
import { postS2SLease } from './serviceAuth'

// TODO: To be replaced with a proper logging library
const logger = console

// Cache of S2S tokens, indexed by microservice name
const cache: { [key: string]: S2SToken } = {}

export class S2SAuth extends events.EventEmitter {
    protected readonly router = Router({ mergeParams: true })

    protected s2sConfig!: S2SConfig

    constructor() {
        super()
    }

    public configure = (s2sConfig: S2SConfig): RequestHandler => {
        this.s2sConfig = s2sConfig
        this.router.use(this.s2sHandler)

        return this.router
    }

    public s2sHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    public validateCache = (): boolean => {
        logger.info('Validating S2S cache')
        const currentTime = Math.floor(Date.now() / 1000)
        if (!cache[this.s2sConfig.microservice]) {
            return false
        }
        return currentTime < cache[this.s2sConfig.microservice].expiresAt
    }

    public getToken = (): S2SToken => {
        return cache[this.s2sConfig.microservice]
    }

    public generateToken = async (): Promise<string> => {
        logger.info('Getting new S2S token')
        const token = await postS2SLease(this.s2sConfig)

        const tokenData: DecodedJWT = jwt_decode(token)

        cache[this.s2sConfig.microservice] = {
            expiresAt: tokenData.exp,
            token,
        } as S2SToken

        return token
    }

    public serviceTokenGenerator = async (): Promise<string> => {
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
