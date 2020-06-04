import { default as strategyFactory } from './strategyFactory.class'
import { OAUTH2 } from '../oauth2'
import { OIDC } from '../oidc'
import { SESSION } from '../../session'

test('oAuth2 Strategy factory', () => {
    const strategy = strategyFactory.getStrategy('oauth2')
    expect(strategy.strategyName).toBe(OAUTH2.STRATEGY_NAME)
})

test('openId Strategy factory', () => {
    const strategy = strategyFactory.getStrategy('oidc')
    expect(strategy.strategyName).toBe(OIDC.STRATEGY_NAME)
})

test('file session Store factory', () => {
    const strategy = strategyFactory.getStrategy('fileStore')
    expect(strategy.storeName).toBe(SESSION.FILE_STORE_NAME)
})

test('redis session Store factory', () => {
    const strategy = strategyFactory.getStrategy('redisStore')
    expect(strategy.storeName).toBe(SESSION.REDIS_STORE_NAME)
})
