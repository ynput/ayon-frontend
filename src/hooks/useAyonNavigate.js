import { useNavigate } from 'react-router'
import { replaceQueryParams } from '@helpers/url'

const useAyonNavigate = () => {
  const navigate = useNavigate()

  const ayonNavigate = (getState) => (url) => {
    const uri = getState().context.uri
    navigate(replaceQueryParams(url, { 'ayon-entity': encodeURIComponent(uri) }))
  }

  return ayonNavigate
}

export default useAyonNavigate
