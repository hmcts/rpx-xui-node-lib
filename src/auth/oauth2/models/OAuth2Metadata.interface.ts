import { _StrategyOptionsBase } from 'passport-oauth2'

export interface OAuth2Metadata extends _StrategyOptionsBase {
    logoutUrl: string
    useRoutes?: boolean
}
