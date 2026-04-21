import { Request } from 'express'
import { createMock } from '@golevelup/ts-jest'

export interface PassportRequest extends Request {
    user?: any;
    isAuthenticated(): this is AuthenticatedRequest;
    isUnauthenticated(): this is UnauthenticatedRequest;
}

interface AuthenticatedRequest extends Request {
    user: any;
}

interface UnauthenticatedRequest extends Request {
    user?: undefined;
}

export function createMockPassportRequest(
    user?: any,
    overrides: Partial<PassportRequest> = {}
): PassportRequest {
    const req = createMock<Request>() as unknown as PassportRequest

    req.user = user ?? undefined
    req.isAuthenticated = function (): this is AuthenticatedRequest {
        return !!this.user
    }
    req.isUnauthenticated = function (): this is UnauthenticatedRequest {
        return !this.user
    }

    Object.assign(req, overrides)
    return req
}
