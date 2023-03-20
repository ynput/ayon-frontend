const constructOAuthToUrl = (url, clientId, redirectUri, scope) => {
  const query = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scope,
    response_type: 'code',
  })
  return `${url}?${query}`
}

export default constructOAuthToUrl
