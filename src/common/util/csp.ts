import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import crypto from 'node:crypto';

export function csp({
  extraScript  = (process.env.CSP_SCRIPT_EXTRA  ?? '').split(',').filter(Boolean),
  extraStyle   = (process.env.CSP_STYLE_EXTRA   ?? '').split(',').filter(Boolean),
  extraConnect = (process.env.CSP_CONNECT_EXTRA ?? '').split(',').filter(Boolean),
  extraFont    = (process.env.CSP_FONT_EXTRA    ?? '').split(',').filter(Boolean),
  extraImg     = (process.env.CSP_IMG_EXTRA     ?? '').split(',').filter(Boolean)
} = {}) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const nonce: string = crypto.randomBytes(16).toString('base64');
    res.locals.cspNonce = nonce;

    helmet.contentSecurityPolicy({
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
      reportOnly: process.env.CSP_REPORT_ONLY === 'true'
    })(req, res, next);
  };
}
