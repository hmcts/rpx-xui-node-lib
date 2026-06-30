import { DecodedJWT } from '../src/auth/s2s'

// Mock implementation for jwtDecode, which returns an object of type DecodedJWT, with an "exp" property
export const jwtDecode = (): DecodedJWT => {
    return {
        exp: Math.floor((Date.now() + 10000) / 1000),
    }
}

export default jwtDecode
