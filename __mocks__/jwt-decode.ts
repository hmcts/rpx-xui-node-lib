import { DecodedJWT } from '../src/auth/s2s'

// Mock implementation for the default export (jwtDecode), which returns an object of type DecodedJWT, with an "exp"
// property
export default (): DecodedJWT => {
    return {
        exp: Math.floor((Date.now() + 10000) / 1000),
    }
}
