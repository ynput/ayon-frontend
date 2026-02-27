import { Dialog } from '@ynput/ayon-react-components'
import { useAppDispatch, useAppSelector } from '@state/store'
import { closeViewer } from '@state/viewer'
import { useEffect } from 'react'
import Viewer from './Viewer'
import styled from 'styled-components'
import { isHTMLElement } from '@shared/util'
import { useDetailsPanelContext } from '@shared/context'

const StyledDialog = styled(Dialog)`
  /* dnd overlay must offset this 32px by 16px */
  width: calc(100% - 32px);
  height: calc(99% - 32px);
  max-height: unset;
  max-width: unset;

  .body {
    overflow: hidden;
    padding: var(--padding-s);
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
  const { closeSlideOut, slideOut: slideOut } = useDetailsPanelContext()

  const dispatch = useAppDispatch()
  // check if dialog is open or not
  const productId = useAppSelector((state) => state.viewer.productId)
  const taskId = useAppSelector((state) => state.viewer.taskId)
  const folderId = useAppSelector((state) => state.viewer.folderId)
  const projectName = useAppSelector((state) => state.viewer.projectName)
  const fullscreen = useAppSelector((state) => state.viewer.fullscreen)

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
        if (slideOut?.entityId) {
          closeSlideOut()
        } else {
          // close the dialog
          handleClose()
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [productId, fullscreen, slideOut?.entityId])

  if ((!productId && !taskId && !folderId) || !projectName) {
    return null
  }

  return (
    <>
      <StyledDialog isOpen hideCancelButton size="full" onClose={() => {}} id="viewer-dialog">
        <Viewer onClose={handleClose} />
      </StyledDialog>
    </>
  )
}

export default ViewerDialog
