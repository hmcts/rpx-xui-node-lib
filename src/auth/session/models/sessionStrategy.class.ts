import { SESSION } from '../session.constants'
import { Strategy } from '../../models'
import { SessionMetadata, SessionStoreOptions } from './sessionMetadata.interface'
import * as express from 'express'
import { default as session } from 'express-session'
import { default as connectRedis } from 'connect-redis'
import { default as redis } from 'redis'
import { default as sessionFileStore } from 'session-file-store'
const logger = console

export class SessionStrategy extends Strategy {
    protected redisClient: any
    constructor() {
        super(SESSION.STRATEGY_NAME)
    }

    public configure = (options: SessionMetadata): express.RequestHandler => {
        const store = this.getStore(options.storeOptions)
        const sessionOptions = SessionStrategy.mapSessionOptions(options, store)
        this.router.use(session(sessionOptions))
        return this.router
    }

    public logout = (req: express.Request, res: express.Response): Promise<void> => {
        throw new Error('Not yet implemented')
    }

    public getStore = (storeOptions: SessionStoreOptions): session.Store => {
        if (storeOptions.useRedisStore && storeOptions.redisStoreOptions) {
            return this.getRedisStore(storeOptions.redisStoreOptions)
        }
        if (!storeOptions.useRedisStore && storeOptions.fileStoreOptions) {
            return this.getFileStore(storeOptions.fileStoreOptions)
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
            logger.info('redis client connected successfully')
        })

        this.redisClient.on('error', (error: any) => {
            logger.error(error)
        })
        const redisStore = connectRedis(session)
        return new redisStore({
            client: this.redisClient,
            ttl: options.redisTtl,
        })
    }

    public getFileStore = (options: { filePath: string }): session.Store => {
        logger.info('using FileStore')
        const fileStore = sessionFileStore(session)
        return new fileStore({
            path: options.filePath,
        })
    }

    public static mapSessionOptions = (options: SessionMetadata, store: session.Store): any => {
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

export default new SessionStrategy()
