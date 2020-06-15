import { EventEmitter } from 'events'
import { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import jwtDecode from 'jwt-decode'
import { authenticator } from 'otplib'
import { http } from '../../common'
import { DecodedJWT } from './decodedJwt.interface'
import { S2S } from './s2s.constants'
import { S2SConfig } from './s2sConfig.interface'
import { S2SToken } from './s2sToken.interface'

export class S2SAuth extends EventEmitter {
    protected readonly router = Router({ mergeParams: true })

    protected s2sConfig: S2SConfig = {
        microservice: '',
        s2sEndpointUrl: '',
        s2sSecret: '',
    }

    // Cache of S2S tokens, indexed by microservice name
    protected store: { [key: string]: S2SToken } = {}

    // Replace with a proper logging library
    protected logger = console

    constructor() {
        super()
    }

    /**
     * This must be called with a suitable configuration before attempting to use the middleware, or else it will not
     * have valid parameter values to generate the S2S token.
     *
     * @param s2sConfig The S2SConfig containing microservice name, S2S endpoint URL, and S2S secret
     * @param store The cache for storing S2S tokens, indexed by microservice name
     * @param logger The logger for logging function call output
     */
    public configure = (
        s2sConfig: S2SConfig,
        store?: { [key: string]: S2SToken },
        logger?: Console,
    ): RequestHandler => {
        this.s2sConfig = s2sConfig
        if (store) {
            this.store = store
        }
        if (logger) {
            this.logger = logger
        }
        this.router.use(this.s2sHandler)

        return this.router
    }

    public s2sHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const token = await this.serviceTokenGenerator()

            if (token) {
                this.logger.info('Adding S2S token to request headers')
                req.headers.ServiceAuthorization = `Bearer ${token}`

                // If there are no listeners for a success event from this emitter, just return this middleware using
                // next(), else emit a success event with the S2S token
                if (!this.listenerCount(S2S.EVENT.AUTHENTICATE_SUCCESS)) {
                    this.logger.info(`S2SAuth: no listener count: ${S2S.EVENT.AUTHENTICATE_SUCCESS}`)
                    return next()
                } else {
                    this.emit(S2S.EVENT.AUTHENTICATE_SUCCESS, token, req, res, next)
                    return
                }
            }
        } catch (error) {
            next(error)
        }
    }

    public validateCache = (): boolean => {
        this.logger.info('Validating S2S token cache')
        const currentTime = Math.floor(Date.now() / 1000)
        if (!this.store[this.s2sConfig.microservice]) {
            return false
        }
        return currentTime < this.store[this.s2sConfig.microservice].expiresAt
    }

    public getToken = (): S2SToken => {
        return this.store[this.s2sConfig.microservice]
    }

    public deleteCachedToken = (): void => {
        if (this.store[this.s2sConfig.microservice]) {
            delete this.store[this.s2sConfig.microservice]
        }
    }

    private generateToken = async (): Promise<string> => {
        this.logger.info('Getting new S2S token')
        const token = await this.postS2SLease()

        const tokenData: DecodedJWT = jwtDecode(token)

        this.store[this.s2sConfig.microservice] = {
            expiresAt: tokenData.exp,
            token,
        } as S2SToken

        return token
    }

    private postS2SLease = async (): Promise<string> => {
        const { s2sSecret, microservice, s2sEndpointUrl } = this.s2sConfig
        const oneTimePassword = authenticator.generate(s2sSecret)

        this.logger.info('Requesting S2S token for microservice:', microservice)

        const request = await http.post(`${s2sEndpointUrl}`, {
            microservice,
            oneTimePassword,
        })

        return request.data
    }

    public serviceTokenGenerator = async (): Promise<string> => {
        if (this.validateCache()) {
            this.logger.info('Getting cached S2S token')
            const tokenData = this.getToken()
            return tokenData.token
        } else {
            return await this.generateToken()
        }
    }

    /**
     * Get all the events that this strategy emits
     * @return string[]
     */
    public getEvents = (): string[] => {
        return Object.values<string>(S2S.EVENT)
    }
}

export const s2s = new S2SAuth()
