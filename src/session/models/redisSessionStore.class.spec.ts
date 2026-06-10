import { RedisSessionStore } from './redisSessionStore.class'
import { createMock } from '@golevelup/ts-jest';
import { RedisSessionMetadata, SessionMetadata } from './sessionMetadata.interface'
import * as redis from 'redis'
import { RedisClientType } from 'redis'
import { Router } from 'express'
import session, { Store } from 'express-session'
import { RedisStore } from 'connect-redis'
import { SESSION } from '../session.constants'
import { XuiLogger } from '../../common'

describe('getStore()', () => {
    const flushPromises = () => new Promise(process.nextTick)

    it('should create and connect the redis client with the redisCloudUrl.', () => {
        const MOCK_REDIS_CLOUD_URL = 'redis://i.am.a.redis.cloud.url'
        const MOCK_REDIS_KEY_PREFIX = 'mockRedisKeyPrefix'
        const MOCK_REDIS_TTL = 123

        const redisSessionMetadata = createMock<RedisSessionMetadata>()

        redisSessionMetadata.redisStoreOptions.redisCloudUrl = MOCK_REDIS_CLOUD_URL
        redisSessionMetadata.redisStoreOptions.redisKeyPrefix = MOCK_REDIS_KEY_PREFIX
        redisSessionMetadata.redisStoreOptions.redisTtl = MOCK_REDIS_TTL

        const mockRedisStore = createMock<RedisClientType>({
            connect: jest.fn().mockResolvedValue(undefined),
        })
        const spyOnRedisCreateClient = jest
            .spyOn(redis, 'createClient')
            .mockReturnValue(mockRedisStore as unknown as ReturnType<typeof redis.createClient>)
        const mockRouter = createMock<Router>()
        const redisSessionStore = new RedisSessionStore(mockRouter)
        const store = redisSessionStore.getStore(redisSessionMetadata)

        expect(spyOnRedisCreateClient).toHaveBeenCalledWith({ url: MOCK_REDIS_CLOUD_URL })
        expect(mockRedisStore.connect).toHaveBeenCalled()
        expect(store.prefix).toEqual(MOCK_REDIS_KEY_PREFIX)
        expect(store.ttl).toEqual(MOCK_REDIS_TTL)
    })

    it('should leave ttl undefined when redisTtl is not configured.', () => {
        const redisSessionMetadata = createMock<RedisSessionMetadata>()

        redisSessionMetadata.redisStoreOptions = {
            redisCloudUrl: 'redis://i.am.a.redis.cloud.url',
            redisKeyPrefix: 'mockRedisKeyPrefix',
            redisTtl: undefined as unknown as RedisSessionMetadata['redisStoreOptions']['redisTtl'],
        }

        const mockRedisStore = createMock<RedisClientType>({
            connect: jest.fn().mockResolvedValue(undefined),
        })
        jest
            .spyOn(redis, 'createClient')
            .mockReturnValue(mockRedisStore as unknown as ReturnType<typeof redis.createClient>)
        const redisSessionStore = new RedisSessionStore(createMock<Router>())
        const store = redisSessionStore.getStore(redisSessionMetadata)

        expect(store.ttl).toEqual(86400)
    })

    it('should log and emit redis client errors when connect rejects.', async () => {
        const redisSessionMetadata = createMock<RedisSessionMetadata>()
        const error = new Error('Unable to connect to redis')

        redisSessionMetadata.redisStoreOptions = {
            redisCloudUrl: 'redis://i.am.a.redis.cloud.url',
            redisKeyPrefix: 'mockRedisKeyPrefix',
            redisTtl: 123,
        }

        const mockRedisStore = createMock<RedisClientType>({
            connect: jest.fn().mockRejectedValue(error),
        })
        jest
            .spyOn(redis, 'createClient')
            .mockReturnValue(mockRedisStore as unknown as ReturnType<typeof redis.createClient>)

        const logger = createMock<XuiLogger>()
        const redisSessionStore = new RedisSessionStore(createMock<Router>(), logger)
        const spyEmitEvent = jest.spyOn(redisSessionStore, 'emitEvent')

        redisSessionStore.getStore(redisSessionMetadata)
        await flushPromises()

        expect(logger.error).toHaveBeenCalledWith(error)
        expect(spyEmitEvent).toHaveBeenCalledWith(SESSION.EVENT.REDIS_CLIENT_ERROR, error)
    })

    describe('Redis client event listeners', () => {
        let redisClient: RedisClientType
        let spyOnRedisClientOnEvent: any

        beforeEach(() => {
            const REDIS_CLIENT_LISTENER = 'on'

            redisClient = createMock<RedisClientType>()

            spyOnRedisClientOnEvent = jest.spyOn(redisClient, REDIS_CLIENT_LISTENER)
        })

        it("should listen for redisClient on 'ready' event.", () => {
            const REDIS_CLIENT_READY_EVENT = 'ready'

            const mockRouter = createMock<Router>()
            const redisSessionStore = new RedisSessionStore(mockRouter)
            redisSessionStore.redisClientReadyListener(redisClient)

            expect(spyOnRedisClientOnEvent).toHaveBeenCalledWith(REDIS_CLIENT_READY_EVENT, expect.any(Function))
        })

        it("should emit and log when redisClient receives the 'ready' event.", () => {
            const mockRouter = createMock<Router>()
            const logger = createMock<XuiLogger>()
            const redisSessionStore = new RedisSessionStore(mockRouter, logger)
            const spyEmitEvent = jest.spyOn(redisSessionStore, 'emitEvent')

            redisSessionStore.redisClientReadyListener(redisClient)
            const readyListener = spyOnRedisClientOnEvent.mock.calls[0][1]
            readyListener()

            expect(spyEmitEvent).toHaveBeenCalledWith(SESSION.EVENT.REDIS_CLIENT_READY, redisClient)
            expect(logger.info).toHaveBeenCalledWith('redis client connected successfully')
            expect(logger.info).toHaveBeenCalledWith('redisClient is ', redisClient)
        })

        it("should listen for redisClient on 'error' event.", () => {
            const REDIS_CLIENT_ERROR_EVENT = 'error'
            const mockRouter = createMock<Router>()
            const redisSessionStore = new RedisSessionStore(mockRouter)
            redisSessionStore.redisClientErrorListener(redisClient)

            expect(spyOnRedisClientOnEvent).toHaveBeenCalledWith(REDIS_CLIENT_ERROR_EVENT, expect.any(Function))
        })

        it("should log and emit when redisClient receives the 'error' event.", () => {
            const error = new Error('Redis client failed')
            const mockRouter = createMock<Router>()
            const logger = createMock<XuiLogger>()
            const redisSessionStore = new RedisSessionStore(mockRouter, logger)
            const spyEmitEvent = jest.spyOn(redisSessionStore, 'emitEvent')

            redisSessionStore.redisClientErrorListener(redisClient)
            const errorListener = spyOnRedisClientOnEvent.mock.calls[0][1]
            errorListener(error)

            expect(logger.error).toHaveBeenCalledWith(error)
            expect(logger.info).toHaveBeenCalledWith('redisClient is ', redisClient)
            expect(spyEmitEvent).toHaveBeenCalledWith(SESSION.EVENT.REDIS_CLIENT_ERROR, error)
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

    sessionStore.configure(options)

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
