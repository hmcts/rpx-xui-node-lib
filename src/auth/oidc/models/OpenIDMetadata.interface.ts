import { ClientMetadata } from 'openid-client'

export interface OpenIDMetadata extends ClientMetadata {
    discovery_endpoint: string
    issuer_url: string
    prompt?: 'login'
    scope: string
    sessionKey?: string
    logout_url?: string
    useRoutes?: boolean
}
