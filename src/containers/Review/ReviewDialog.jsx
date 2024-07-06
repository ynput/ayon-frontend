import { Dialog } from '@ynput/ayon-react-components'
import { useDispatch, useSelector } from 'react-redux'
import { closeReview } from '@state/review'
import { useEffect } from 'react'
import Review from './Review'
import styled from 'styled-components'

const StyledDialog = styled(Dialog)`
  width: calc(100% - 3vw);
  height: calc(100% - 7vh);
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

const ReviewDialog = () => {
  const dispatch = useDispatch()
  // check if dialog is open or not
  const productId = useSelector((state) => state.review.productId)
  const projectName = useSelector((state) => state.review.projectName)

  const handleClose = () => {
    // close the dialog
    dispatch(closeReview())
  }

  // when pressing escape key, close the dialog
  useEffect(() => {
    const handleEscape = (e) => {
      // check shortcut isn't inside an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      // check shortcut isn't inside a contenteditable element
      if (e.target.isContentEditable) return

      if (e.key === 'Escape') {
        handleClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [productId])

  if (!productId || !projectName) return null

  return (
    <>
      <StyledDialog isOpen hideCancelButton size="full">
        <Review onClose={handleClose} />
      </StyledDialog>
    </>
  )
}

export default ReviewDialog
