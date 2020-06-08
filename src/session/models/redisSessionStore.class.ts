import { SESSION } from '../session.constants'
import { RedisSessionMetadata } from './sessionMetadata.interface'
import session from 'express-session'
import { default as connectRedis } from 'connect-redis'
import {default as redis, RedisClient} from 'redis'
import { SessionStore } from './sessionStore.class'

export class RedisSessionStore extends SessionStore {
    protected redisClient: redis.RedisClient | any

    constructor() {
        super(SESSION.REDIS_STORE_NAME)
    }

    /**
     * If we use this as an interface to set the Redis Client, we are then
     * able to mock what redisClient this class uses, and therefore mock
     * functions such as 'on()' on it.
     *
     * @param {redis.RedisClient} redisClient
     */
    public setRedisClient = (redisClient: redis.RedisClient) => {
        this.redisClient = redisClient;
    }

    public getRedisClient = () => this.redisClient;

    public getStore = (options: RedisSessionMetadata): connectRedis.RedisStore => {

        // tested by spying on createClient
        const tlsOptions = {
            prefix: options.redisStoreOptions.redisKeyPrefix,
        }

        // Tested spying on createClient and passing in of params
        this.redisClient = redis.createClient(options.redisStoreOptions.redisCloudUrl, tlsOptions)

        // Break out
        this.redisClient.on('ready', () => {
            if (this.listenerCount(SESSION.EVENT.REDIS_CLIENT_READY)) {
                this.emit(SESSION.EVENT.REDIS_CLIENT_READY, this.redisClient)
            }
            this.logger.info('redis client connected successfully')
        })
        // this.redisClientReadyListener(this.redisClient);

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

    // TODO: Remove side effecting on redisClient, listenerCount, emit and logger.
    // change type
    public redisClientReadyListener = (redisClient:any) => {
        redisClient.on('ready', () => {
            if (this.listenerCount(SESSION.EVENT.REDIS_CLIENT_READY)) {
                this.emit(SESSION.EVENT.REDIS_CLIENT_READY, redisClient)
            }
            this.logger.info('redis client connected successfully')
        })
    }

    // TODO: Remove side effects on listenerCount, emit and logger.
    // public dispatchRedisClientReady = (redisClient: RedisClient, listenerCount: any) => {
    //     redisClient.on('ready', () => {
    //         if (listenerCount) {
    //             this.emit(SESSION.EVENT.REDIS_CLIENT_READY, redisClient)
    //         }
    //         this.logger.info('redis client connected successfully')
    //     })
    // }

    public shouldReturnTrue = () => true;
}

export default new RedisSessionStore()
