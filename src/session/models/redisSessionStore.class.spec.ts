import { RedisSessionStore } from './redisSessionStore.class'
import { createMock } from 'ts-auto-mock'
import { RedisSessionMetadata, SessionMetadata } from './sessionMetadata.interface'
import { default as redis } from 'redis'
import { Router } from 'express'
import session, { Store } from 'express-session'
import { RedisStore } from 'connect-redis'

describe('getStore()', () => {
    it('should call redis.createClient() with the redisCloudUrl.', () => {
        const MOCK_REDIS_CLOUD_URL = 'redis://i.am.a.redis.cloud.url'
        const MOCK_REDIS_KEY_PREFIX = 'mockRedisKeyPrefix'

        const redisSessionMetadata = createMock<RedisSessionMetadata>()

        redisSessionMetadata.redisStoreOptions.redisCloudUrl = MOCK_REDIS_CLOUD_URL
        redisSessionMetadata.redisStoreOptions.redisKeyPrefix = MOCK_REDIS_KEY_PREFIX

        const mockRedisStore = createMock<redis.RedisClient>()
        const spyOnRedisCreateClient = jest.spyOn(redis, 'createClient').mockReturnValue(mockRedisStore)
        const mockRouter = createMock<Router>()
        const redisSessionStore = new RedisSessionStore(mockRouter)
        redisSessionStore.getStore(redisSessionMetadata)

        expect(spyOnRedisCreateClient).toHaveBeenCalledWith(MOCK_REDIS_CLOUD_URL, { prefix: MOCK_REDIS_KEY_PREFIX })
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

            const mockRouter = createMock<Router>()
            const redisSessionStore = new RedisSessionStore(mockRouter)
            redisSessionStore.redisClientReadyListener(redisClient)

            expect(spyOnRedisClientOnEvent).toHaveBeenCalledWith(REDIS_CLIENT_READY_EVENT, expect.any(Function))
        })

        it("should listen for redisClient on 'error' event.", () => {
            const REDIS_CLIENT_ERROR_EVENT = 'error'
            const mockRouter = createMock<Router>()
            const redisSessionStore = new RedisSessionStore(mockRouter)
            redisSessionStore.redisClientErrorListener(redisClient)

            expect(spyOnRedisClientOnEvent).toHaveBeenCalledWith(REDIS_CLIENT_ERROR_EVENT, expect.any(Function))
        })
    })
})

test('sessionStore configure', () => {
    const mockRouter = createMock<Router>()
    const spyUse = jest.spyOn(mockRouter, 'use')
    const sessionStore = new RedisSessionStore(mockRouter)
    const options = {} as SessionMetadata
    const spyClassStore = jest.spyOn(sessionStore, 'getClassStore').mockReturnValue({} as Store)
    const spySessionOptions = jest.spyOn(sessionStore, 'mapSessionOptions').mockReturnValue({} as any)
    const returnRouter = sessionStore.configure(options)
    expect(spyClassStore).toHaveBeenCalled()
    expect(spySessionOptions).toHaveBeenCalled()
    expect(spyUse).toHaveBeenCalled()
})

test('sessionStore getClassStore error', () => {
    const mockRouter = createMock<Router>()
    const sessionStore = new RedisSessionStore(mockRouter)
    expect(() => {
        sessionStore.getClassStore(null as unknown as SessionMetadata)
    }).toThrowError('Store Options are missing')
})

test('sessionStore getClassStore', () => {
    const storeMock = createMock<RedisStore>()
    const mockSessionMetadata = createMock<SessionMetadata>()
    const mockRouter = createMock<Router>()
    const sessionStore = new RedisSessionStore(mockRouter)
    const spyGetStore = jest.spyOn(sessionStore, 'getStore').mockReturnValue(storeMock)
    sessionStore.getClassStore(mockSessionMetadata)
    expect(spyGetStore).toHaveBeenCalled()
})

test('sessionStore mapSessionOptions', () => {
    const options = {
        cookie: {
            httpOnly: false,
            maxAge: 123,
            secure: false,
        },
        name: 'name',
        resave: false,
        saveUninitialized: true,
        secret: 'secret',
    }
    const mockStore = createMock<session.Store>()
    const mockRouter = createMock<Router>()
    const redisSessionStore = new RedisSessionStore(mockRouter)
    const result = redisSessionStore.mapSessionOptions(options, mockStore)

    expect(result.cookie).toEqual(options.cookie)
    expect(result.name).toEqual(options.name)
    expect(result.resave).toEqual(options.resave)
    expect(result.saveUninitialized).toEqual(options.saveUninitialized)
    expect(result.secret).toEqual(options.secret)
    expect(result.store).toEqual(mockStore)
})

test('emitEvent with no subscribers', () => {
    const mockRouter = createMock<Router>()
    const redisSessionStore = new RedisSessionStore(mockRouter)

    const spyEmit = jest.spyOn(redisSessionStore, 'emit')
    const spy = jest.spyOn(redisSessionStore, 'listenerCount').mockReturnValue(0)
    redisSessionStore.emitEvent('eventName', {})
    expect(spy).toHaveBeenCalled()
    expect(spyEmit).not.toHaveBeenCalled()
})

test('emitEvent with subscribers', () => {
    const mockRouter = createMock<Router>()
    const redisSessionStore = new RedisSessionStore(mockRouter)

    const spyEmit = jest.spyOn(redisSessionStore, 'emit')
    const spy = jest.spyOn(redisSessionStore, 'listenerCount').mockReturnValue(1)
    redisSessionStore.emitEvent('eventName', {})
    expect(spy).toHaveBeenCalled()
    expect(spyEmit).toHaveBeenCalled()
})
