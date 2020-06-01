/**
 * A type defining the necessary parameters for S2S token generation.
 */
export interface S2SConfig {
    microservice: string
    s2sEndpointUrl: string
    s2sSecret: string
}
