import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import crypto from 'node:crypto';

export function csp({
  extraScript  = (process.env.CSP_SCRIPT_EXTRA  ?? '').split(',').filter(Boolean),
  extraStyle   = (process.env.CSP_STYLE_EXTRA   ?? '').split(',').filter(Boolean),
  extraConnect = (process.env.CSP_CONNECT_EXTRA ?? '').split(',').filter(Boolean),
  extraFont    = (process.env.CSP_FONT_EXTRA    ?? '').split(',').filter(Boolean),
  extraImg     = (process.env.CSP_IMG_EXTRA     ?? '').split(',').filter(Boolean),
  // old csp to merge with
  defaultCsp   = {}
} = {}) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const nonce: string = crypto.randomBytes(16).toString('base64');
    res.locals.cspNonce = nonce;
    const newCsp = {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src":  ["'self'", `'nonce-${nonce}'`, ...extraScript],
        "style-src":   ["'self'", `'nonce-${nonce}'`, ...extraStyle],
        "connect-src": ["'self'", "blob:", "data:", ...extraConnect],
        "img-src":     ["'self'", "data:", ...extraImg],
        "font-src":    ["'self'", "data:", "https://fonts.gstatic.com", ...extraFont],
        "object-src":  ["'none'"],
        "frame-src":   ["'self'"],
        "frame-ancestors": ["'self'"],
        "form-action": ["'none'"]
      },
      // if CSP_REPORT_ONLY is set to true, use report-only mode
      // this allows you to test your CSP without enforcing it
      reportOnly: process.env.CSP_REPORT_ONLY === 'true'
    }
    const csp = { ...defaultCsp, ...newCsp };
    helmet.contentSecurityPolicy(csp)(req, res, next);
  };
}
