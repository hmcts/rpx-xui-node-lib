import redisSessionStore from './redisSessionStore.class'
import { createMock } from 'ts-auto-mock'
import { RedisSessionMetadata } from './sessionMetadata.interface'
import { default as redis } from 'redis'

describe('getStore()', () => {
    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('should call redis.createClient() with the redisCloudUrl.', () => {
        const MOCK_REDIS_CLOUD_URL = 'redis://i.am.a.redis.cloud.url'
        const MOCK_REDIS_KEY_PREFIX = 'mockRedisKeyPrefix'

        const redisSessionMetadata = createMock<RedisSessionMetadata>()

        redisSessionMetadata.redisStoreOptions.redisCloudUrl = MOCK_REDIS_CLOUD_URL
        redisSessionMetadata.redisStoreOptions.redisKeyPrefix = MOCK_REDIS_KEY_PREFIX

        const spyOnRedisCreateClient = jest.spyOn(redis, 'createClient')

        redisSessionStore.getStore(redisSessionMetadata)

        expect(spyOnRedisCreateClient).toBeCalledWith(MOCK_REDIS_CLOUD_URL, { prefix: MOCK_REDIS_KEY_PREFIX })
    })

    describe('Redis client event listeners', () => {
        let redisClient: redis.RedisClient
        let spyOnRedisClientOnEvent: any

        beforeEach(() => {
            const REDIS_CLIENT_LISTENER = 'on'

            redisClient = createMock<redis.RedisClient>()

            spyOnRedisClientOnEvent = jest.spyOn(redisClient, REDIS_CLIENT_LISTENER)
        })

        it("should listen for redisClient on 'ready' event.", () => {
            const REDIS_CLIENT_READY_EVENT = 'ready'

            redisSessionStore.redisClientReadyListener(redisClient)

            expect(spyOnRedisClientOnEvent).toBeCalledWith(REDIS_CLIENT_READY_EVENT, expect.any(Function))
        })

        it("should listen for redisClient on 'error' event.", () => {
            const REDIS_CLIENT_ERROR_EVENT = 'error'

            redisSessionStore.redisClientErrorListener(redisClient)

            expect(spyOnRedisClientOnEvent).toBeCalledWith(REDIS_CLIENT_ERROR_EVENT, expect.any(Function))
        })
    })
})
