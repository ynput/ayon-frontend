import { useState } from 'react'
import { toast } from 'react-toastify'
import { isEqual } from 'lodash'
import { Button, SaveButton } from '@ynput/ayon-react-components'
import { getRequestErrorString } from '@shared/util'
import Type from '@/theme/typography.module.css'
import { applyEdits } from './applyLayout'
import { stopEditing, useLayoutEdit } from './layoutEditor'
import * as Styled from './LayoutEditBanner.styled'

/**
 * The bar along the bottom of the app while a layout is edited, on every page: what is edited,
 * Cancel and Save. Save puts the sidebar and tab rows into the layout (or the user's copy of it).
 */
const LayoutEditBanner = () => {
  const edit = useLayoutEdit()
  const [saving, setSaving] = useState(false)
  if (!edit) return null

  const changed = !isEqual(edit.initial, edit.draft)
  const save = async () => {
    setSaving(true)
    try {
      await edit.save((current) => applyEdits(current, edit.draft))
      stopEditing()
    } catch (error) {
      toast.error(`Couldn't save the layout: ${getRequestErrorString(error)}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Styled.Banner data-layout-edit-banner="">
      <Styled.Main>
        <span className={Type.titleMedium}>
          Editing layout &ldquo;{edit.name}&rdquo;. Hide or show sidebar items and tabs with the
          eye, drag them to reorder.
        </span>
        <Button variant="text" label="Cancel" disabled={saving} onClick={stopEditing} />
        <SaveButton label="Save layout" active={changed} saving={saving} onClick={save} />
      </Styled.Main>
    </Styled.Banner>
  )
}

export default LayoutEditBanner
