import { default as strategyFactory } from './strategyFactory.class'
import { OAUTH2 } from '../oauth2'
import { OIDC } from '../oidc'
import { SESSION } from '../session/session.constants'
/* eslint-disable @typescript-eslint/camelcase */
test('oAuth2 Strategy factory', () => {
    const strategy = strategyFactory.getStrategy('oauth2')
    expect(strategy.strategyName).toBe(OAUTH2.STRATEGY_NAME)
})

test('openId Strategy factory', () => {
    const strategy = strategyFactory.getStrategy('oidc')
    expect(strategy.strategyName).toBe(OIDC.STRATEGY_NAME)
})

test('session Strategy factory', () => {
    const strategy = strategyFactory.getStrategy('session')
    expect(strategy.strategyName).toBe(SESSION.STRATEGY_NAME)
})
/* eslint-disable @typescript-eslint/camelcase */
