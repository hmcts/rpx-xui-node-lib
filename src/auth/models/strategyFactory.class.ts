import oAuth2 from '../oauth2/models/oauth2.class'
import openid from '../oidc/models/openid.class'
import session from '../session/models/sessionStrategy.class'
import { Strategy } from './strategy.class'
import { OAUTH2 } from '../oauth2'
import { OIDC } from '../oidc'
import { SESSION } from '../session/session.constants'

export type StrategyType = 'oauth2' | 'oidc' | 's2s' | 'session'

class StrategyFactory {
    public getStrategy = (strategyType: StrategyType): Strategy => {
        switch (strategyType) {
            case OAUTH2.STRATEGY_NAME:
                return oAuth2
            case OIDC.STRATEGY_NAME:
                return openid
            case SESSION.STRATEGY_NAME:
                return session
            default:
                throw new Error('Invalid Strategy Type')
        }
    }
}

export default new StrategyFactory()
