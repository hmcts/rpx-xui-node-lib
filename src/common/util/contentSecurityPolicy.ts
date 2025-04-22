export const SECURITY_POLICY = {
    directives: {
        connectSrc: [
            "'self' blob: data:",
            '*.gov.uk',
            'dc.services.visualstudio.com',
            '*.launchdarkly.com',
            'https://*.google-analytics.com',
            'https://*.googletagmanager.com',
            'https://*.analytics.google.com',
            '*.hmcts.net',
            'wss://*.webpubsub.azure.com',
            'wss://em-icp-webpubsub.aat.platform.hmcts.net',
            'wss://em-icp-webpubsub.demo.platform.hmcts.net',
            'wss://em-icp-webpubsub.perftest.platform.hmcts.net',
            'wss://em-icp-webpubsub.ithc.platform.hmcts.net',
            'wss://em-icp-webpubsub.prod.platform.hmcts.net',
            'wss://em-icp-webpubsub.platform.hmcts.net',
            'https://*.in.applicationinsights.azure.com',
            'https://*.monitor.azure.com',
        ],
        defaultSrc: ["'self'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        formAction: ["'none'"],
        frameAncestors: ["'self'"],
        frameSrc: ["'self'"],
        imgSrc: [
            "'self'",
            'data:',
            'https://*.google-analytics.com',
            'https://*.googletagmanager.com',
            'https://raw.githubusercontent.com/hmcts/',
            'https://stats.g.doubleclick.net/',
            'https://ssl.gstatic.com/',
            'https://www.gstatic.com/',
            'https://fonts.gstatic.com',
        ],
        mediaSrc: ["'self'"],
        scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            'https://*.google-analytics.com',
            'https://*.googletagmanager.com',
            'az416426.vo.msecnd.net',
        ],
        styleSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://www.googletagmanager.com',
        ],
    },
}

export const getContentSecurityPolicy = (helmet: any) => {
    return helmet.contentSecurityPolicy(SECURITY_POLICY)
}
