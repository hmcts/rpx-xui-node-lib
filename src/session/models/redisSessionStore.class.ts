import { SESSION } from '../session.constants'
import { RedisSessionMetadata } from './sessionMetadata.interface'
import session from 'express-session'
import { default as connectRedis } from 'connect-redis'
import { default as redis } from 'redis'
import { SessionStore } from './sessionStore.class'

export class RedisSessionStore extends SessionStore {
    protected redisClient: redis.RedisClient | any

    constructor() {
        super(SESSION.REDIS_STORE_NAME)
    }

    public getStore = (options: RedisSessionMetadata): connectRedis.RedisStore => {
        const tlsOptions = {
            prefix: options.redisStoreOptions.redisKeyPrefix,
        }

        this.redisClient = redis.createClient(options.redisStoreOptions.redisCloudUrl, tlsOptions)

        this.redisClient.on('ready', () => {
            if (this.listenerCount(SESSION.EVENT.REDIS_CLIENT_READY)) {
                this.emit(SESSION.EVENT.REDIS_CLIENT_READY, this.redisClient)
            }
            this.logger.info('redis client connected successfully')
        })

        this.redisClient.on('error', (error: any) => {
            this.logger.error(error)
            this.logger.info('redisClient is ', this.redisClient)
            if (this.listenerCount(SESSION.EVENT.REDIS_CLIENT_ERROR)) {
                this.emit(SESSION.EVENT.REDIS_CLIENT_ERROR, error)
            }
        })
        const redisStore = connectRedis(session)
        return new redisStore({
            client: this.redisClient,
            ttl: options.redisStoreOptions.redisTtl,
        })
    }
}

export default new RedisSessionStore()
