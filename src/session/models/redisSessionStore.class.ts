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
    public redisClientReadyListener = (redisClient: redis.RedisClient) => {
        redisClient.on('ready', () => {
            if (this.listenerCount(SESSION.EVENT.REDIS_CLIENT_READY)) {
                this.emit(SESSION.EVENT.REDIS_CLIENT_READY, redisClient)
            }
            this.logger.info('redis client connected successfully')
        })
    }

    public redisClientErrorListener = (redisClient: redis.RedisClient) => {
        redisClient.on('error', (error: any) => {
            this.logger.error(error)
            this.logger.info('redisClient is ', redisClient)
            if (this.listenerCount(SESSION.EVENT.REDIS_CLIENT_ERROR)) {
                this.emit(SESSION.EVENT.REDIS_CLIENT_ERROR, error)
            }
        })
    }
}

export default new RedisSessionStore()
