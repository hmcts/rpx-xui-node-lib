import { csp } from './csp'
import helmet from 'helmet'

jest.mock('helmet', () => ({
  contentSecurityPolicy: jest.fn(() => (req: any, res: any, next: any) => {
    res.setHeader('Content-Security-Policy', 'mocked-csp-header')
    next()
  })
}))

describe('csp middleware', () => {
  let req: any
  let res: any
  let next: jest.Mock

  beforeEach(() => {
    req = {}
    res = { locals: {}, setHeader: jest.fn() }
    next = jest.fn()
  })

  it('should set a nonce on res.locals', () => {
    csp()(
      req,
      res,
      next
    )
    expect(res.locals.cspNonce).toBeDefined()
    expect(typeof res.locals.cspNonce).toBe('string')
    expect(next).toHaveBeenCalled(); 
  })

  it('should call helmet.contentSecurityPolicy with correct directives', () => {
    csp()(
      req,
      res,
      next
    )
    expect(helmet.contentSecurityPolicy).toHaveBeenCalledWith(
      expect.objectContaining({
        directives: expect.objectContaining({
          "script-src": expect.arrayContaining([
            "'self'",
            expect.stringMatching(/^'nonce-/)
          ]),
          "style-src": expect.arrayContaining([
            "'self'",
            expect.stringMatching(/^'nonce-/)
          ])
        })
      })
    )
  })

  it('should add extra directives from options', () => {
    csp({
      extraScript: ['https://extra-script.com'],
      extraStyle: ['https://extra-style.com'],
      extraConnect: ['https://extra-connect.com'],
      extraFont: ['https://extra-font.com'],
      extraImg: ['https://extra-img.com']
    })(req, res, next)
    const calls = ((helmet.contentSecurityPolicy as unknown) as jest.Mock).mock.calls;
    const call = calls[calls.length - 1][0];
    expect(call.directives['script-src']).toContain('https://extra-script.com')
    expect(call.directives['style-src']).toContain('https://extra-style.com')
    expect(call.directives['connect-src']).toContain('https://extra-connect.com')
    expect(call.directives['font-src']).toContain('https://extra-font.com')
    expect(call.directives['img-src']).toContain('https://extra-img.com')
    expect(next).toHaveBeenCalled(); 
  })

  it('should set Content-Security-Policy header', () => {
    csp()(req, res, next)
    expect(res.setHeader).toHaveBeenCalledWith('Content-Security-Policy', 'mocked-csp-header')
    expect(next).toHaveBeenCalled()
  })

  it('honours CSP_REPORT_ONLY env flag', () => {
    process.env.CSP_REPORT_ONLY = 'true';
    csp()(req, res, next);
    const opts = ((helmet.contentSecurityPolicy as unknown) as jest.Mock).mock.calls.pop()[0];
    expect(opts.reportOnly).toBe(true);
    delete process.env.CSP_REPORT_ONLY;
    expect(next).toHaveBeenCalled(); 
  })

  it('merges extras from environment variables', () => {
    process.env.CSP_SCRIPT_EXTRA = 'https://env-script.com';
    csp()(req, res, next);
    const opts = ((helmet.contentSecurityPolicy as unknown) as jest.Mock).mock.calls.pop()[0];
    expect(opts.directives['script-src']).toContain('https://env-script.com');
    delete process.env.CSP_SCRIPT_EXTRA;
    expect(next).toHaveBeenCalled(); 
  })
})