const getSimplifiedUrl = (urlSring: string): string => {
  const url = new URL(urlSring)
  return url.hostname + url.pathname
}

const replaceQueryParams = (relativeUrl: string, params: {[key: string]: string}) => {
  const urlParams = new URLSearchParams(relativeUrl.split('?')[1])
  const pathName = relativeUrl.split('?')[0]

  Object.keys(params).forEach(key => urlParams.set(key, params[key]))

  const paramsString = urlParams.toString()
  return paramsString ? `${pathName}?${paramsString}` : relativeUrl
}

export { getSimplifiedUrl, replaceQueryParams }
