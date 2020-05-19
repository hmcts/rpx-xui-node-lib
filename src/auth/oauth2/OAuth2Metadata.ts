import { _StrategyOptionsBase } from 'passport-oauth2'

export interface OAuth2Metadata extends _StrategyOptionsBase {
    scope: string
    sessionKey?: string
    logoutUrl: string
    useRoutes?: boolean
}
