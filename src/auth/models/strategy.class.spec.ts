import { Router } from 'express'
import { XuiLogger } from '../../common'
import { Strategy } from './strategy.class'

class TestStrategy extends Strategy {
    constructor(logger: XuiLogger) {
        super('test', Router({ mergeParams: true }), logger)
    }
}

const getMockLogger = (): XuiLogger => {
    return {
        log: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    }
}

test('initialiseStrategy should not log authentication secrets', async () => {
    const logger = getMockLogger()
    const strategy = new TestStrategy(logger)
    const options = {
        clientID: 'client-id',
        clientSecret: 'very-secret',
        routeCredential: {
            userName: 'user@xui',
            password: 'super-secret-password',
        },
    }

    await strategy.initialiseStrategy(options)

    expect(logger.log).toHaveBeenCalledTimes(2)
    const loggedOptions = (logger.log as jest.Mock).mock.calls[1][0]
    expect(loggedOptions).toContain('[REDACTED]')
    expect(loggedOptions).not.toContain('very-secret')
    expect(loggedOptions).not.toContain('super-secret-password')
})

test('redactingLogReplacer should redact nested sensitive keys and retain non-sensitive values', () => {
    const logger = getMockLogger()
    const strategy = new TestStrategy(logger)
    const options = {
        clientSecret: 'very-secret',
        tokenURL: 'http://idam/token',
        nested: {
            client_secret: 'another-secret',
            refreshToken: 'refresh-token-value',
            list: [{ serviceAuthorization: 's2s-token' }],
        },
    }

    const serialized = JSON.stringify(options, (strategy as any).redactingLogReplacer)

    expect(serialized).toContain('"clientSecret":"[REDACTED]"')
    expect(serialized).toContain('"client_secret":"[REDACTED]"')
    expect(serialized).toContain('"refreshToken":"[REDACTED]"')
    expect(serialized).toContain('"serviceAuthorization":"[REDACTED]"')
    expect(serialized).toContain('"tokenURL":"[REDACTED]"')
})
