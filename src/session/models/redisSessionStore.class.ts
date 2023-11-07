import { SESSION } from '../session.constants'
import { RedisSessionMetadata } from './sessionMetadata.interface'
import session from 'express-session'
import { default as connectRedis } from 'connect-redis'
import * as redis from 'redis'
import { SessionStore } from './sessionStore.class'
import { Router } from 'express'
import { getLogger, XuiLogger } from '../../common'

export class RedisSessionStore extends SessionStore {
    protected redisClient: redis.RedisClient | any

    constructor(router = Router({ mergeParams: true }), logger: XuiLogger = getLogger('session:redis')) {
        super(SESSION.REDIS_STORE_NAME, router, logger)
    }

    public getStore = (options: RedisSessionMetadata): connectRedis.RedisStore => {
        const tlsOptions = {
            prefix: options.redisStoreOptions.redisKeyPrefix,
        }

        this.redisClient = redis.createClient(options.redisStoreOptions.redisCloudUrl, tlsOptions)

        this.redisClientReadyListener(this.redisClient)
        this.redisClientErrorListener(this.redisClient)

        const redisStore = connectRedis(session)
        return new redisStore({
            client: this.redisClient,
            ttl: options.redisStoreOptions.redisTtl,
        })
    }

    // TODO: This should be a pure function. Remove side effecting on redisClient,
    // listenerCount, emit and logger, when you have Redis setup on a local machine,
    // ( to check that it still works )
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public redisClientReadyListener = (redisClient: redis.RedisClient) => {
        redisClient.on('ready', () => {
            this.emitEvent(SESSION.EVENT.REDIS_CLIENT_READY, redisClient)
            this.logger.info('redis client connected successfully')
            this.logger.info('redisClient is ', redisClient)
        })
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public redisClientErrorListener = (redisClient: redis.RedisClient) => {
        redisClient.on('error', (error: any) => {
            this.logger.error(error)
            this.logger.info('redisClient is ', redisClient)
            this.emitEvent(SESSION.EVENT.REDIS_CLIENT_ERROR, error)
        })
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public emitEvent = (eventName: string, eventObject: any) => {
        if (this.listenerCount(SESSION.EVENT.REDIS_CLIENT_READY)) {
            this.emit(eventName, eventObject)
        }
    }
}

export const redisStore = new RedisSessionStore()
