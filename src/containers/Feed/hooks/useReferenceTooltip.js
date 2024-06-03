import { useSelector } from 'react-redux'
import { hideRefTooltip, showRefTooltip } from '/src/features/details'

const useReferenceTooltip = ({ dispatch }) => {
  const refTooltip = useSelector((state) => state.details.refTooltip)

  const setRefTooltip = (ref) => {
    if (ref && ref.id !== refTooltip.id) {
      // open
      dispatch(showRefTooltip(ref))
    }

    if (!ref && refTooltip.id) {
      // close
      dispatch(hideRefTooltip())
    }
  }

  return [refTooltip, setRefTooltip]
}

export default useReferenceTooltip
