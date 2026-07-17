import { SESSION } from '../session.constants'
import { RedisSessionMetadata } from './sessionMetadata.interface'
import { RedisStore } from 'connect-redis'
import { createClient, RedisClientType } from 'redis'
import { SessionStore } from './sessionStore.class'
import { Router } from 'express'
import { getLogger, XuiLogger } from '../../common'

export class RedisSessionStore extends SessionStore {
    protected redisClient!: RedisClientType

    constructor(router = Router({ mergeParams: true }), logger: XuiLogger = getLogger('session:redis')) {
        super(SESSION.REDIS_STORE_NAME, router, logger)
    }

    public getStore = (options: RedisSessionMetadata): RedisStore => {
        const ttl = options.redisStoreOptions.redisTtl === undefined
            ? undefined
            : Number(options.redisStoreOptions.redisTtl)
        const redisCloudUrl = this.normalizeRedisUrl(options.redisStoreOptions.redisCloudUrl)

        this.redisClient = createClient({
            url: redisCloudUrl,
        })

        this.redisClientReadyListener(this.redisClient)
        this.redisClientErrorListener(this.redisClient)

        this.redisClient.connect().catch((error: Error) => {
            this.logger.error(error)
            this.emitEvent(SESSION.EVENT.REDIS_CLIENT_ERROR, error)
        })

        return new RedisStore({
            client: this.redisClient,
            prefix: options.redisStoreOptions.redisKeyPrefix,
            ttl,
        })
    }

    // TODO: This should be a pure function. Remove side effecting on redisClient,
    // listenerCount, emit and logger, when you have Redis setup on a local machine,
    // ( to check that it still works )
    public redisClientReadyListener = (redisClient: RedisClientType) => {
        redisClient.on('ready', () => {
            this.emitEvent(SESSION.EVENT.REDIS_CLIENT_READY, redisClient)
            this.logger.info('redis client connected successfully')
            this.logger.info('redisClient is ', redisClient)
        })
    }

    public redisClientErrorListener = (redisClient: RedisClientType) => {
        redisClient.on('error', (error: any) => {
            this.logger.error(error)
            this.logger.info('redisClient is ', redisClient)
            this.emitEvent(SESSION.EVENT.REDIS_CLIENT_ERROR, error)
        })
    }

    public emitEvent = (eventName: string, eventObject: any) => {
        if (this.listenerCount(SESSION.EVENT.REDIS_CLIENT_READY)) {
            this.emit(eventName, eventObject)
        }
    }

    // Keep compatibility with legacy Azure-style URLs: redis://...?...&tls=true
    // redis@6 expects TLS via rediss:// or socket.tls.
    public normalizeRedisUrl = (redisCloudUrl: string): string => {
        try {
            const parsedRedisUrl = new URL(redisCloudUrl)
            const tlsEnabledViaQuery = parsedRedisUrl.searchParams.get('tls')?.toLowerCase() === 'true'

            if (tlsEnabledViaQuery && parsedRedisUrl.protocol === 'redis:') {
                parsedRedisUrl.protocol = 'rediss:'
                parsedRedisUrl.searchParams.delete('tls')
                return parsedRedisUrl.toString()
            }

            return redisCloudUrl
        } catch {
            // Preserve previous behavior if URL parsing fails.
            return redisCloudUrl
        }
    }
}

export const redisStore = new RedisSessionStore()
