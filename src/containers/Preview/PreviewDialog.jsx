import { Dialog } from '@ynput/ayon-react-components'
import { useDispatch, useSelector } from 'react-redux'
import { closePreview, openPreview } from '/src/features/preview'
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
  const { selected, projectName } = useSelector((state) => state.preview)

  const [searchParams, setUrlSearchParams] = useSearchParams()
  //   usually just one id is passed, but multiple ids can be passed
  const queryIds = searchParams.getAll('preview_id') || []
  //   we need a project name
  const queryProjectName = searchParams.get('project_name') || undefined
  // when url has preview_id and preview_type, open the dialog if not already open

  useEffect(() => {
    if (!queryIds.length || !queryProjectName) return
    // check if dialog is already open with same ids
    if (isEqual(selected, queryIds)) return
    // open the dialog
    dispatch(openPreview({ selected: queryIds, projectName: queryProjectName }))
  }, [queryProjectName])

  const handleClose = () => {
    // remove query params preview_id and preview_type from url
    searchParams.delete('preview_id')
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
  }, [selected])

  if (!selected.length) return null

  return (
    <>
      <StyledDialog isOpen={selected.length && projectName} hideCancelButton size="full">
        <Preview {...{ selected, projectName }} onClose={handleClose} />
      </StyledDialog>
    </>
  )
}

export default PreviewDialog
