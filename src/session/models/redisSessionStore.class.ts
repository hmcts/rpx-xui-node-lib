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
        const ttl = this.parseTtl(options.redisStoreOptions.redisTtl)
        const redisClientConfig = this.getRedisClientConfig(options.redisStoreOptions.redisCloudUrl)

        this.redisClient = createClient(redisClientConfig)

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
            const hasUsernameOnlyCredentials = parsedRedisUrl.username !== '' && parsedRedisUrl.password === ''
            const tlsEnabledViaQuery = parsedRedisUrl.searchParams.get('tls')?.toLowerCase() === 'true'

            // Some environments provide redis://<access-key>@host:port (without ':').
            // Redis v6 expects password auth, so rewrite to redis://:password@host:port.
            if (hasUsernameOnlyCredentials) {
                parsedRedisUrl.password = decodeURIComponent(parsedRedisUrl.username)
                parsedRedisUrl.username = ''
            }

            if (tlsEnabledViaQuery && parsedRedisUrl.protocol === 'redis:') {
                parsedRedisUrl.protocol = 'rediss:'
                parsedRedisUrl.searchParams.delete('tls')
            }

            return parsedRedisUrl.toString()
        } catch {
            // Preserve previous behavior if URL parsing fails.
            return redisCloudUrl
        }
    }

    // RedisStore defaults to 86400s when ttl is undefined.
    public parseTtl = (redisTtl: number | string | undefined): number | undefined => {
        if (redisTtl === undefined || redisTtl === null || redisTtl === '') {
            return undefined
        }

        const parsedTtl = Number(redisTtl)
        return Number.isFinite(parsedTtl) && parsedTtl > 0 ? parsedTtl : undefined
    }

    // Supports both URL-style values and legacy Azure cache strings:
    // host:port,password=...,ssl=true,abortConnect=false
    public getRedisClientConfig = (redisCloudUrl: string) => {
        const normalizedRedisUrl = this.normalizeRedisUrl(redisCloudUrl)
        if (/^rediss?:\/\//i.test(normalizedRedisUrl)) {
            return { url: normalizedRedisUrl }
        }

        const [hostPort, ...connectionParts] = redisCloudUrl.split(',').map((part) => part.trim())
        const [host, portValue] = hostPort.split(':')
        const port = Number(portValue)

        if (!host || !Number.isFinite(port)) {
            return { url: normalizedRedisUrl }
        }

        const parsedParts = connectionParts.reduce<Record<string, string>>((accumulator, part) => {
            const [key, ...valueParts] = part.split('=')
            if (!key || valueParts.length === 0) {
                return accumulator
            }

            accumulator[key.trim().toLowerCase()] = valueParts.join('=').trim()
            return accumulator
        }, {})

        const tlsEnabled = parsedParts.ssl?.toLowerCase() === 'true' || parsedParts.tls?.toLowerCase() === 'true'

        return {
            socket: {
                host,
                port,
                ...(tlsEnabled ? { tls: true as const } : {}),
            },
            ...(parsedParts.password ? { username: parsedParts.user ?? parsedParts.username ?? 'default' } : {}),
            password: parsedParts.password,
        }
    }
}

export const redisStore = new RedisSessionStore()
