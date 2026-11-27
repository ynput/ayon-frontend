import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { isEqual } from 'lodash'
import { Button, SaveButton } from '@ynput/ayon-react-components'
import { getRequestErrorString } from '@shared/util'
import Type from '@/theme/typography.module.css'
import { applyEdits } from './applyLayout'
import { saveEdit, stopEditing, useLayoutEdit } from './layoutEditor'
import { getPins } from './pins'
import * as Styled from './LayoutEditBanner.styled'

/**
 * The bar along the bottom of the app while a layout is edited, on every page: what is edited,
 * Cancel and Save. Save puts the sidebar, the tab rows and the pins into the layout (or the user's
 * copy of it).
 */
const LayoutEditBanner = () => {
  const edit = useLayoutEdit()
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  if (!edit) return null

  const cancel = () => {
    stopEditing()
    // a tab pinned in this edit goes with it: when it is open, back to the page with its own view,
    // as after Unpin
    const params = new URLSearchParams(search)
    const open = params.get('view')
    const pinned = (layout: typeof edit.draft) => getPins(layout).some((pin) => pin.id === open)
    if (!open || !pinned(edit.draft) || pinned(edit.initial)) return
    params.delete('view')
    const rest = params.toString()
    navigate(rest ? `${pathname}?${rest}` : pathname)
  }

  const changed = !isEqual(edit.initial, edit.draft)
  const save = () =>
    saveEdit(applyEdits).catch((error) =>
      toast.error(`Couldn't save the layout: ${getRequestErrorString(error)}`),
    )

  return (
    <Styled.Banner data-layout-edit-banner="">
      <Styled.Main>
        <span className={Type.titleMedium}>
          Editing layout &ldquo;{edit.name}&rdquo;. Hide or show sidebar items and tabs with the
          eye, drag them to reorder.
        </span>
        <Button variant="text" label="Cancel" disabled={edit.saving} onClick={cancel} />
        <SaveButton
          label="Save layout"
          active={changed && !edit.saving}
          saving={edit.saving}
          onClick={save}
        />
      </Styled.Main>
    </Styled.Banner>
  )
}

export default LayoutEditBanner
