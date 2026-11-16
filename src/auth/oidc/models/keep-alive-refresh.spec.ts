import { OpenID } from './openid.class'
import { AUTH } from '../../auth.constants'
import express, { Request, Response, Router } from 'express'
import * as http from 'node:http'
import { XuiLogger } from '../../../common'

const logger = { log: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() } as unknown as XuiLogger
const response = {} as Response

function fixture(introspect: jest.Mock, refresh: jest.Mock) {
  const oidc = new OpenID(Router(), logger)
  const client = { issuer: { metadata: { introspection_endpoint: 'synthetic' } }, introspect, refresh }
  jest.spyOn(oidc, 'getClient').mockReturnValue(client as never)
  const req = { session: { passport: { user: { tokenset: { accessToken: 'synthetic', refreshToken: 'synthetic-refresh' } } } }, isAuthenticated: () => true } as unknown as Request
  return { oidc, req }
}

test('inactive token refreshes and invokes listener with replaced tokens once', async () => {
  const introspect = jest.fn().mockResolvedValue({ active: false })
  const refresh = jest.fn().mockResolvedValue({ access_token: 'new-access', refresh_token: 'new-refresh' })
  const { oidc, req } = fixture(introspect, refresh)
  const next = jest.fn()
  const listener = jest.fn()
  oidc.on(AUTH.EVENT.AUTHENTICATE_SUCCESS, listener)
  await oidc.keepAliveHandler(req, response, next)
  expect(introspect).toHaveBeenCalledWith('synthetic')
  expect(refresh).toHaveBeenCalledWith('synthetic-refresh')
  expect(req.session.passport.user.tokenset).toEqual({ accessToken: 'new-access', refreshToken: 'new-refresh', idToken: undefined })
  expect(listener).toHaveBeenCalledTimes(1)
  expect(listener).toHaveBeenCalledWith(req, response, next)
  expect(req.isRefresh).toBe(true)
  expect(next).not.toHaveBeenCalled()
})

test('refresh failure forwards error exactly once', async () => {
  const error = new Error('synthetic refresh failure')
  const { oidc, req } = fixture(jest.fn().mockResolvedValue({ active: false }), jest.fn().mockRejectedValue(error))
  const next = jest.fn()
  await oidc.keepAliveHandler(req, response, next)
  expect(next.mock.calls).toEqual([[error]])
})

test('active introspected token continues once without refresh', async () => {
  const refresh = jest.fn()
  const { oidc, req } = fixture(jest.fn().mockResolvedValue({ active: true, exp: Math.floor(Date.now() / 1000) + 600 }), refresh)
  const next = jest.fn()
  await oidc.keepAliveHandler(req, response, next)
  expect(refresh).not.toHaveBeenCalled()
  expect(next.mock.calls).toEqual([[]])
})

test('refresh without success listener continues once with new tokens', async () => {
  const { oidc, req } = fixture(jest.fn().mockResolvedValue({ active: false }), jest.fn().mockResolvedValue({ access_token: 'new-access', refresh_token: 'new-refresh' }))
  const next = jest.fn()
  await oidc.keepAliveHandler(req, response, next)
  expect(req.session.passport.user.tokenset.accessToken).toBe('new-access')
  expect(next.mock.calls).toEqual([[]])
})

test('Express refresh failure reaches error handler and never reaches protected route', async () => {
  const error = new Error('synthetic refresh failure')
  const { oidc } = fixture(jest.fn().mockResolvedValue({ active: false }), jest.fn().mockRejectedValue(error))
  const app = express()
  const route = jest.fn((_req, res) => res.status(200).end('unexpected'))
  const errors = jest.fn((_err, _req, res, _next) => res.status(503).end('refresh failed'))
  app.use((req, _res, next) => {
    Object.assign(req, { session: { passport: { user: { tokenset: { accessToken: 'synthetic', refreshToken: 'synthetic-refresh' } } } }, isAuthenticated: () => true })
    next()
  })
  app.use(oidc.keepAliveHandler)
  app.get('/', route)
  app.use(errors)
  const server = http.createServer(app)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  try {
    const port = (server.address() as import('node:net').AddressInfo).port
    const result = await fetch(`http://127.0.0.1:${port}/`)
    expect(result.status).toBe(503)
    expect(await result.text()).toBe('refresh failed')
    expect(errors).toHaveBeenCalledTimes(1)
    expect(route).not.toHaveBeenCalled()
  } finally {
    await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve()))
  }
})
