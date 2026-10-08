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

test('getSSOLogoutUrl should include required end session parameters using the id token', async () => {
    const logger = getMockLogger()
    const strategy = new TestStrategy(logger)
    await strategy.initialiseStrategy({
        ssoLogoutURL: 'http://idam.test/o/endSession',
    })

    const ssoLogoutUrl = strategy.getSSOLogoutUrl('http://service.test', 'id-token-value') as string
    const parsedUrl = new URL(ssoLogoutUrl)

    expect(`${parsedUrl.origin}${parsedUrl.pathname}`).toEqual('http://idam.test/o/endSession')
    expect(parsedUrl.searchParams.get('post_logout_redirect_uri')).toEqual('http://service.test')
    expect(parsedUrl.searchParams.get('id_token_hint')).toEqual('id-token-value')
    expect(parsedUrl.searchParams.get('id_token_hint')).not.toEqual('access-token-value')
})

test('getSSOLogoutUrl should not build an end session URL without an id token', async () => {
    const logger = getMockLogger()
    const strategy = new TestStrategy(logger)
    await strategy.initialiseStrategy({
        ssoLogoutURL: 'http://idam.test/o/endSession',
    })

    expect(strategy.getSSOLogoutUrl('http://service.test')).toBeUndefined()
})
