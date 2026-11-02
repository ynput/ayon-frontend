import axios from 'axios'

// How ayon-frontend keeps a session: the token in localStorage, on axios requests and in a
// cookie (for <img>, <video> and downloads). Shared so the addon dev shell does the same.
export const storeAccessToken = (accessToken: string) => {
  localStorage.setItem('accessToken', accessToken)
  axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
  document.cookie = `accessToken=${accessToken}; path=/; max-age=86400`
}

export const clearAccessToken = () => {
  localStorage.removeItem('accessToken')
  delete axios.defaults.headers.common['Authorization']
  document.cookie = 'accessToken=; path=/; max-age=0'
}
