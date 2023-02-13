import { Dialog } from 'primereact/dialog'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { closeShare } from '../features/context'
import { Button } from '@ynput/ayon-react-components'
import copyToClipboard from '../helpers/copyToClipboard'
import { TabView, TabPanel } from 'primereact/tabview'
import { toast } from 'react-toastify'

const ShareStyled = styled.div`
  padding: 16px;

  background-color: var(--color-grey-00);
  border-radius: 3px;
  position: relative;
  display: flex;
  justify-content: center;
  max-width: fit-content;
  padding-right: 64px;

  /* top right corner */
  button {
    position: absolute;
    top: 8px;
    right: 8px;
  }

  img {
    max-width: 30vw;
  }
`

const ShareDialog = () => {
  const dispatch = useDispatch()
  const share = useSelector((state) => state.context.share)
  const { name, data, img, link } = share

  if (!name || !data) return null

  const convertToBlob = async (base64) => {
    const res = await fetch(base64).catch((error) => console.error(error))
    return res.blob()
  }

  const copyImage = async (img) => {
    const blob = await convertToBlob(img)
    // copies image to clipboard
    navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
    toast.info('Image copied to clipboard')
  }

  const string = JSON.stringify(data, null, 2).replace(/"/g, '').replace(/{|}/g, '').slice(1, -1)
  return (
    <Dialog header={`Share: ${name}`} visible onHide={() => dispatch(closeShare())}>
      <ShareStyled>
        {link}
        <Button icon="content_copy" onClick={() => copyToClipboard(link)} />
      </ShareStyled>
      <br />
      <TabView>
        <TabPanel header="Text">
          <ShareStyled>
            <pre>{string}</pre>
            <Button icon="content_copy" onClick={() => copyToClipboard(string)} />
          </ShareStyled>
        </TabPanel>
        <TabPanel header="Image">
          <ShareStyled>
            <img src={img} />
            <Button icon="content_copy" onClick={() => copyImage(img)} />
          </ShareStyled>
        </TabPanel>
      </TabView>
    </Dialog>
  )
}

export default ShareDialog
