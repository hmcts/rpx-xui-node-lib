import { default as connectRedis } from 'connect-redis'
import { default as session } from 'express-session'
import { default as redis } from 'redis'
import { default as sessionFileStore } from 'session-file-store'
import { SessionStoreOptions } from './sessionMetadata.interface'
const logger = console

const redisStore = connectRedis(session)
const fileStore = sessionFileStore(session)

export const getRedisStore = (options: {
    redisKeyPrefix: string
    redisCloudUrl: string
    redisTtl: number | string
}): connectRedis.RedisStore => {
    const tlsOptions = {
        prefix: options.redisKeyPrefix,
    }

    const redisClient = redis.createClient(options.redisCloudUrl, tlsOptions)

    redisClient.on('ready', () => {
        logger.info('redis client connected successfully')
    })

    redisClient.on('error', (error) => {
        logger.error(error)
    })

    return new redisStore({
        client: redisClient,
        ttl: options.redisTtl,
    })
}

export const getFileStore = (options: { filePath: string }): session.Store => {
    logger.info('using FileStore')
    return new fileStore({
        path: options.filePath,
    })
}
