import { Dialog } from '@ynput/ayon-react-components'
import { useDispatch, useSelector } from 'react-redux'
import { closeReview, openReview } from '@state/review'
import { useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import Review from './Review'
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

const ReviewDialog = () => {
  const dispatch = useDispatch()
  // check if dialog is open or not
  const { productId, versionIds, projectName } = useSelector((state) => state.review)

  const [searchParams, setUrlSearchParams] = useSearchParams()
  //   we need a project name
  const queryProductId = searchParams.get('review_product') || undefined
  //   usually just one id is passed, but multiple ids can be passed
  const queryVersionIds = searchParams.getAll('review_version') || []
  //   we need a project name
  const queryProjectName = searchParams.get('project_name') || undefined
  // when url has review_product and review_type, open the dialog if not already open

  useEffect(() => {
    // we must have both productId and projectName
    if (!queryProductId || !queryProjectName) return
    // check if dialog is already open with same productId and version
    if (productId === queryProductId && isEqual(versionIds, queryVersionIds)) return

    // open the dialog
    dispatch(
      openReview({
        productId: queryProductId,
        versionIds: queryVersionIds,
        projectName: queryProjectName,
      }),
    )
  }, [queryProductId, queryVersionIds, queryProjectName])

  const handleClose = () => {
    // remove query params review and review_type from url
    searchParams.delete('review_product')
    searchParams.delete('review_version')
    searchParams.delete('project_name')
    setUrlSearchParams(searchParams)
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
  }, [versionIds])

  if (!productId || !projectName) return null

  return (
    <>
      <StyledDialog isOpen hideCancelButton size="full">
        <Review {...{ productId, versionIds, projectName }} onClose={handleClose} />
      </StyledDialog>
    </>
  )
}

export default ReviewDialog
