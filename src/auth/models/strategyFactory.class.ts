import oAuth2 from '../oauth2/models/oauth2.class'
import openid from '../oidc/models/openid.class'
import { Strategy } from './strategy.class'

export type StrategyType = 'oAuth2' | 'openId' | 's2s' | 'session'

class StrategyFactory {
    public getStrategy = (strategyType: StrategyType): Strategy => {
        switch (strategyType) {
            case 'oAuth2':
                return oAuth2
            case 'openId':
                return openid
            default:
                throw new Error('Invalid Strategy Type')
        }
    }
}

export default new StrategyFactory()
