import oAuth2 from '../oauth2/models/oauth2.class'
import openid from '../oidc/models/openid.class'
import redisSession from '../../session/models/redisSessionStore.class'
import fileSession from '../../session/models/fileSessionStore.class'
import { OAUTH2 } from '../oauth2'
import { OIDC } from '../oidc'
import { SESSION } from '../../session'

export type StrategyType = 'oauth2' | 'oidc' | 's2s' | 'fileStore' | 'redisStore'

class StrategyFactory {
    public getStrategy = (strategyType: StrategyType): any => {
        switch (strategyType) {
            case OAUTH2.STRATEGY_NAME:
                return oAuth2
            case OIDC.STRATEGY_NAME:
                return openid
            case SESSION.REDIS_STORE_NAME:
                return redisSession
            case SESSION.FILE_STORE_NAME:
                return fileSession
            default:
                throw new Error('Invalid Strategy Type')
        }
    }
}

export default new StrategyFactory()
