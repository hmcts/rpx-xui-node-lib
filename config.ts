import 'jest-ts-auto-mock'

// Some tests can trigger background OpenID discovery (openid-client) that may reject
// after the suite completes, causing Node to crash the Jest process.
// Swallow AggregateError rejections so test runs exit cleanly.
process.on('unhandledRejection', (reason: unknown) => {
	if (reason instanceof AggregateError) {
		return
	}
})

