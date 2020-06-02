import { SESSION } from '../session.constants'
import { Strategy } from '../../models'
import { RedisSessionMetadata } from './sessionMetadata.interface'
import * as express from 'express'
import session from 'express-session'
import { default as connectRedis } from 'connect-redis'
import { default as redis } from 'redis'
const logger = console

export class RedisSessionStrategy extends Strategy {
    protected redisClient: any
    constructor() {
        super(SESSION.REDIS_STRATEGY_NAME)
    }

    public configure = (options: RedisSessionMetadata): express.RequestHandler => {
        const store = this.getStore(options)
        const sessionOptions = RedisSessionStrategy.mapSessionOptions(options, store)
        this.router.use(session(sessionOptions))
        return this.router
    }

    public logout = (req: express.Request, res: express.Response): Promise<void> => {
        throw new Error('Not yet implemented')
    }

    public getStore = (storeOptions: RedisSessionMetadata): session.Store => {
        if (storeOptions.redisStoreOptions) {
            return this.getRedisStore(storeOptions.redisStoreOptions)
        }
        throw new Error('store Options are missing')
    }

    public getRedisStore = (options: {
        redisKeyPrefix: string
        redisCloudUrl: string
        redisTtl: number | string
    }): connectRedis.RedisStore => {
        const tlsOptions = {
            prefix: options.redisKeyPrefix,
        }

        this.redisClient = redis.createClient(options.redisCloudUrl, tlsOptions)

        this.redisClient.on('ready', () => {
            if (this.listenerCount(SESSION.EVENT.REDIS_CLIENT_READY)) {
                this.emit(SESSION.EVENT.REDIS_CLIENT_READY, this.redisClient)
            }
            logger.info('redis client connected successfully')
        })

        this.redisClient.on('error', (error: any) => {
            logger.error(error)
            logger.info('redisClient is ', this.redisClient)
            if (this.listenerCount(SESSION.EVENT.REDIS_CLIENT_ERROR)) {
                this.emit(SESSION.EVENT.REDIS_CLIENT_ERROR, error)
            }
        })
        console.log('session options', session)
        const redisStore = connectRedis(session)
        return new redisStore({
            client: this.redisClient,
            ttl: options.redisTtl,
        })
    }

    public static mapSessionOptions = (options: RedisSessionMetadata, store: session.Store): any => {
        return {
            cookie: options.cookie,
            name: options.name,
            resave: options.resave,
            saveUninitialized: options.saveUninitialized,
            secret: options.secret,
            store,
        }
    }
}

export default new RedisSessionStrategy()
