import { RefTooltip } from '../context/FeedContext'
import { useFeedContext } from '../context/FeedContextInstance'

const useReferenceTooltip = (): [RefTooltip | null, (t: RefTooltip | null) => void] => {
  const { refTooltip, setRefTooltip } = useFeedContext()

  const handleSetRefTooltip = (ref: RefTooltip | null) => {
    if (ref && ref.id !== refTooltip?.id) {
      // open
      setRefTooltip(ref)
    }

    if (!ref) {
      // close
      setRefTooltip(null)
    }
  }

  return [refTooltip, handleSetRefTooltip]
}

export default useReferenceTooltip
