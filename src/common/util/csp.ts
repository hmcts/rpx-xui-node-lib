import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import crypto from 'node:crypto';
import merge from 'deepmerge';

export function csp({
  extraScript = (process.env.CSP_SCRIPT_EXTRA ?? '').split(',').filter(Boolean),
  extraStyle = (process.env.CSP_STYLE_EXTRA ?? '').split(',').filter(Boolean),
  extraConnect = (process.env.CSP_CONNECT_EXTRA ?? '').split(',').filter(Boolean),
  extraFont = (process.env.CSP_FONT_EXTRA ?? '').split(',').filter(Boolean),
  extraImg = (process.env.CSP_IMG_EXTRA ?? '').split(',').filter(Boolean),
  defaultCsp = {}
} = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const nonce = crypto.randomBytes(16).toString('base64');
    res.locals.cspNonce = nonce;

    const newCsp = {
      useDefaults: true,
      directives: {
        // dashed form is fine too, but keep the SAME spelling everywhere
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", `'nonce-${nonce}'`, ...extraScript],
        styleSrc: ["'self'", `'nonce-${nonce}'`, ...extraStyle],

        connectSrc: ["'self'", "blob:", "data:", ...extraConnect],
        imgSrc: ["'self'", "data:", ...extraImg],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com", ...extraFont],

        objectSrc: ["'none'"],
        frameSrc: ["'self'"],
        frameAncestors: ["'self'"],
        formAction: ["'none'"]
      },
      reportOnly: process.env.CSP_REPORT_ONLY === 'true'
    };

    // deep‑merge so we don’t lose anything from SECURITY_POLICY
    const finalCsp = merge(defaultCsp, newCsp);

    helmet.contentSecurityPolicy(finalCsp)(req, res, next);
  };
}
