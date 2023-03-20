const constructOAuthToUrl = (url, clientId, name, scope) => {
  const redirectUri = `${window.location.origin}/login/${name}`
  const query = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scope,
    response_type: 'code',
  })
  return `${url}?${query}`
}

export default constructOAuthToUrl
