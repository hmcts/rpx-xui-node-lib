import oidc from './openid.class'
import passport from 'passport'
import { Request, Response, NextFunction } from 'express'

test('OIDC Auth', () => {
    expect(oidc).toBeDefined()
})

test('OIDC configure serializeUser', () => {
    const spy = jest.spyOn(passport, 'serializeUser')
    oidc.serializeUser()
    expect(spy).toBeCalled()
})

test('OIDC configure deserializeUser', () => {
    const spy = jest.spyOn(passport, 'deserializeUser')
    oidc.deserializeUser()
    expect(spy).toBeCalled()
})

test('OIDC loginHandler', () => {
    const spy = jest.spyOn(passport, 'authenticate')
    const mockRequest = {
        body: {},
    } as Request
    const mockResponse = {} as Response
    const next = jest.fn()

    oidc.loginHandler(mockRequest, mockResponse, next)
    expect(spy).toBeCalled()
})

test('OIDC jwTokenExpired', () => {
    const spy = jest
    let jwtData = { exp: new Date('Jun 04, 2020').getTime() / 1000 }
    let isTokenExpired = oidc.jwTokenExpired(jwtData)
    expect(isTokenExpired).toBeTruthy()

    jwtData = { exp: new Date().getTime() / 1000 }
    isTokenExpired = oidc.jwTokenExpired(jwtData)
    expect(isTokenExpired).toBeFalsy()
})

test('OIDC configure initializePassport', () => {
    jest.mock('express', () => ({
        Router: () => ({
            use: jest.fn(),
        }),
    }))
    const spy = jest.spyOn(passport, 'initialize')
    oidc.initializePassport()
    expect(spy).toBeCalled()
})

test('OIDC configure initializeSession', () => {
    jest.mock('express', () => ({
        Router: () => ({
            use: jest.fn(),
        }),
    }))
    const spy = jest.spyOn(passport, 'session')
    oidc.initializeSession()
    expect(spy).toBeCalled()
})
