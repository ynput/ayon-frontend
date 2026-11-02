import type { GetSiteInfoResult } from '@shared/api'

// index.html starts GET /api/info?full=true before the app bundle has downloaded, so the
// first request the app waits on runs in parallel with loading and running the JS.
// It resolves to null when it failed or wasn't started (no stored token), callers then make
// the request as usual.

declare global {
  interface Window {
    __siteInfoRequest?: Promise<GetSiteInfoResult | null>
  }
}

/** The early /api/info response, once: later calls (e.g. after login) get null */
export const takeEarlySiteInfo = async (): Promise<GetSiteInfoResult | null> => {
  const request = window.__siteInfoRequest
  window.__siteInfoRequest = undefined
  if (!request) return null
  try {
    return await request
  } catch {
    return null
  }
}
