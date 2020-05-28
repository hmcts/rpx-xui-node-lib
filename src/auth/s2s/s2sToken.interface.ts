/**
 * Simple wrapper type representing an S2S token, containing "expiresAt" (the exp value from the decoded token) and
 * wrapping the raw token itself.
 */
export interface S2SToken {
    expiresAt: number
    token: string
}
