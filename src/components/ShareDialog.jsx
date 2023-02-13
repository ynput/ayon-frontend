import { Dialog } from 'primereact/dialog'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { closeShare } from '../features/context'
import { Button } from '@ynput/ayon-react-components'
import copyToClipboard from '../helpers/copyToClipboard'

const ShareStyled = styled.div`
  padding: 16px;
  background-color: var(--panel-background);
  border-radius: 3px;
  position: relative;
  padding-right: 48px;

  /* top right corner */
  button {
    position: absolute;
    top: 8px;
    right: 8px;
  }
`

const ShareDialog = () => {
  const dispatch = useDispatch()
  const share = useSelector((state) => state.context.share)
  const { name, data } = share

  if (!name || !data) return null

  const string = JSON.stringify(data, null, 2).replace(/"/g, '').replace(/{|}/g, '').slice(1, -1)
  return (
    <Dialog header={`Share: ${name}`} visible onHide={() => dispatch(closeShare())}>
      <ShareStyled>
        <pre>{string}</pre>
        <Button icon="content_copy" onClick={() => copyToClipboard(string)} />
      </ShareStyled>
    </Dialog>
  )
}

export default ShareDialog
