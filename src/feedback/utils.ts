const BASE_API = 'https://ynput.cloud/api/feedback'

type Params = {
  returnUrl?: string
  email?: string
  fullName?: string
  instanceId?: string
  orgId?: string
}

export const buildSSOUrl = (params: Params) => {
  // build url with params
  const url = new URL(BASE_API)
  url.searchParams.set('returnUrl', params.returnUrl || '')
  url.searchParams.set('email', params.email || '')
  url.searchParams.set('fullName', params.fullName || '')
  url.searchParams.set('instanceId', params.instanceId || '')
  url.searchParams.set('orgId', params.orgId || '')
}
