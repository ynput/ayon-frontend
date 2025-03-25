import { Dialog } from '@ynput/ayon-react-components'
import { useAppDispatch, useAppSelector } from '@state/store'
import { closeViewer } from '@state/viewer'
import { useEffect } from 'react'
import Viewer from './Viewer'
import styled from 'styled-components'
import isHTMLElement from '@helpers/isHTMLElement'
import { closeSlideOut } from '@state/details'

const StyledDialog = styled(Dialog)`
  /* dnd overlay must offset this 64px by 32px */
  width: calc(100% - 64px);
  height: calc(99% - 64px);
  max-height: unset;
  max-width: unset;

  .body {
    overflow: hidden;
    padding: var(--padding-m);
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
  const dispatch = useAppDispatch()
  // check if dialog is open or not
  const productId = useAppSelector((state) => state.viewer.productId)
  const taskId = useAppSelector((state) => state.viewer.taskId)
  const folderId = useAppSelector((state) => state.viewer.folderId)
  const projectName = useAppSelector((state) => state.viewer.projectName)
  const fullscreen = useAppSelector((state) => state.viewer.fullscreen)
  const slideOut = useAppSelector((state: any) => state.details.slideOut['review'])

  const handleClose = () => {
    // close the dialog
    dispatch(closeViewer())
  }

  // when pressing escape key, close the dialog
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      // Check if e.target is an HTMLElement before accessing tagName or isContentEditable
      if (isHTMLElement(e.target)) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
        if (e.target.isContentEditable) return
        if (e.target.closest('.block-shortcuts')) return
      }

      if (e.key === 'Escape' && !fullscreen) {
        // first check if slideOut is open
        if (slideOut.entityId) {
          // close the slideOut
          dispatch(closeSlideOut())
        } else {
          // close the dialog
          handleClose()
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [productId, fullscreen, slideOut.entityId])

  if ((!productId && !taskId && !folderId) || !projectName) {
    return null
  }

  return (
    <>
      <StyledDialog isOpen hideCancelButton size="full" onClose={() => {}}>
        <Viewer onClose={handleClose} />
      </StyledDialog>
    </>
  )
}

export default ViewerDialog
