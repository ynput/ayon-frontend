// When an application asks the server for access to AYON and the user is not logged in,
// the server's authorization endpoint sends the browser here to log in:
//   /?auth_return=/api/oauth/authorize?client_id=...
// After the login the browser goes back to that address, which shows the approval page.
//
// Only paths of the authorization server are accepted: the address comes from a link, and a
// link must not be able to send a logged-in user anywhere else, on this server or another.

export const AUTH_RETURN_PARAM = 'auth_return'
const AUTH_RETURN_PREFIX = '/api/oauth/'

export const getAuthReturn = (search: string, origin: string): string | null => {
  const value = new URLSearchParams(search).get(AUTH_RETURN_PARAM)
  if (!value || !value.startsWith(AUTH_RETURN_PREFIX)) return null
  try {
    // resolves "..", so the checks below see the path the browser would request
    const url = new URL(value, origin)
    if (url.origin !== origin) return null
    if (!url.pathname.startsWith(AUTH_RETURN_PREFIX)) return null
    return url.pathname + url.search
  } catch {
    return null
  }
}
