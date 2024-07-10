import { Dialog } from '@ynput/ayon-react-components'
import { useDispatch, useSelector } from 'react-redux'
import { closeReview } from '@state/review'
import { useEffect } from 'react'
import Viewer from './Viewer'
import styled from 'styled-components'
import { useLocation } from 'react-router'
import { $Any } from '@/types'

const StyledDialog = styled(Dialog)`
  /* dnd overlay must offset this 64px by 32px */
  width: calc(100% - 64px);
  height: calc(100% - 64px);
  max-height: unset;
  max-width: unset;

  .body {
    overflow: hidden;
  }
  &:focus-visible {
    outline: none;
  }
  /* hide header and footer */
  .header,
  .footer {
    display: none;
  }
`

const ViewerDialog = () => {
  const location = useLocation()
  const dispatch = useDispatch()
  // check if dialog is open or not
  const productId = useSelector((state: $Any) => state.review.productId)
  const projectName = useSelector((state: $Any) => state.review.projectName)
  const fullscreen = useSelector((state: $Any) => state.review.fullscreen)

  const handleClose = () => {
    // close the dialog
    dispatch(closeReview())
  }

  // when pressing escape key, close the dialog
  useEffect(() => {
    const isHTMLElement = (target: EventTarget | null): target is HTMLElement => {
      return target instanceof HTMLElement
    }

    const handleEscape = (e: KeyboardEvent) => {
      // Check if e.target is an HTMLElement before accessing tagName or isContentEditable
      if (isHTMLElement(e.target)) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
        if (e.target.isContentEditable) return
      }

      if (e.key === 'Escape' && !fullscreen) {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [productId, fullscreen])

  if (!productId || !projectName) return null

  return (
    <>
      <StyledDialog
        isOpen={location.pathname !== '/review'}
        hideCancelButton
        size="full"
        onClose={() => {}}
      >
        <Viewer onClose={handleClose} canOpenInNew />
      </StyledDialog>
    </>
  )
}

export default ViewerDialog
