import { Dialog } from '@ynput/ayon-react-components'
import { useDispatch, useSelector } from 'react-redux'
import { closePreview, openPreview } from '@state/preview'
import { useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import Preview from './Preview'
import { isEqual } from 'lodash'
import styled from 'styled-components'

const StyledDialog = styled(Dialog)`
  width: calc(100% - 64px);
  height: calc(100% - 64px);
  max-height: 1300px;
  max-width: 2000px;

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

const PreviewDialog = () => {
  const dispatch = useDispatch()
  // check if dialog is open or not
  const { productId, versionIds, projectName } = useSelector((state) => state.preview)

  const [searchParams, setUrlSearchParams] = useSearchParams()
  //   we need a project name
  const queryProductId = searchParams.get('preview_product') || undefined
  //   usually just one id is passed, but multiple ids can be passed
  const queryVersionIds = searchParams.getAll('preview_version') || []
  //   we need a project name
  const queryProjectName = searchParams.get('project_name') || undefined
  // when url has preview_product and preview_type, open the dialog if not already open

  useEffect(() => {
    // we must have both productId and projectName
    if (!queryProductId || !queryProjectName) return
    // check if dialog is already open with same productId and version
    if (productId === queryProductId && isEqual(versionIds, queryVersionIds)) return

    // open the dialog
    dispatch(
      openPreview({
        productId: queryProductId,
        versionIds: queryVersionIds,
        projectName: queryProjectName,
      }),
    )
  }, [queryProductId, queryVersionIds, queryProjectName])

  const handleClose = () => {
    // remove query params preview_product and preview_type from url
    searchParams.delete('preview_product')
    searchParams.delete('preview_version')
    searchParams.delete('project_name')
    setUrlSearchParams(searchParams)
    // close the dialog
    dispatch(closePreview())
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
  }, [versionIds])

  if (!productId || !projectName) return null

  return (
    <>
      <StyledDialog isOpen hideCancelButton size="full">
        <Preview {...{ productId, versionIds, projectName }} onClose={handleClose} />
      </StyledDialog>
    </>
  )
}

export default PreviewDialog
