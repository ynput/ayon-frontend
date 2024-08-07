const getSimplifiedUrl = (urlSring: string): string => {
  const url = new URL(urlSring)
  return url.hostname + url.pathname
}

export { getSimplifiedUrl }
