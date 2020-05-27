import { default as strategyFactory } from './strategyFactory.class'
import { OAUTH2 } from '../oauth2'
import { OIDC } from '../oidc'
/* eslint-disable @typescript-eslint/camelcase */
test('oAuth2 Strategy factory', () => {
    const strategy = strategyFactory.getStrategy('oAuth2')
    expect(strategy.strategyName).toBe(OAUTH2.STRATEGY_NAME)
})

test('openId Strategy factory', () => {
    const strategy = strategyFactory.getStrategy('openId')
    expect(strategy.strategyName).toBe(OIDC.STRATEGY_NAME)
})
/* eslint-disable @typescript-eslint/camelcase */
