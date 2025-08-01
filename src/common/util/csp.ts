import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import crypto from 'node:crypto';
import merge from 'deepmerge';                     // <-- deep merge helper

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
        /* camel‑case so they merge onto the existing ones */
        defaultSrc: ["'self'"],                               // default-src
        scriptSrc: ["'self'", `'nonce-${nonce}'`, ...extraScript],
        styleSrc: ["'self'", `'nonce-${nonce}'`, ...extraStyle],

        /* style attribute allowance */
        styleSrcAttr: ["'unsafe-inline'"],                     // style-src-attr

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

    const finalCsp = merge(defaultCsp, newCsp);
    helmet.contentSecurityPolicy(finalCsp)(req, res, next);
  };
}
