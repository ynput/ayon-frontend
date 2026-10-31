// What AYON's api modules read from the page when they load, for tests that use the api's store
// without a browser.
Object.assign(globalThis, { window: { location: { origin: 'http://localhost' } } })
