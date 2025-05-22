import { useNavigate } from 'react-router-dom'
import { replaceQueryParams } from '@helpers/url'
import { ayonUrlParam } from '@/constants'

const useAyonNavigate = () => {
  const navigate = useNavigate()

  const ayonNavigate = (getState) => (url) => {
    const uri = getState().context.uri
    navigate(replaceQueryParams(url, { [ayonUrlParam]: encodeURIComponent(uri) }))
  }

  return ayonNavigate
}

export default useAyonNavigate
