import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { closeShare } from '@state/context'
import { Button, Dialog } from '@ynput/ayon-react-components'
import { copyToClipboard } from '@shared/util'
import { TabView, TabPanel } from 'primereact/tabview'

const ShareStyled = styled.div`
  padding: 16px;

  background-color: var(--panel-background);
  border-radius: 3px;
  position: relative;
  display: flex;
  justify-content: center;
  max-width: fit-content;
  padding-right: 64px;

  /* top right corner */
  button {
    position: absolute;
    top: 16px;
    right: 8px;
  }

  pre {
    background-color: var(--panel-background);
    padding: 16px;
    border-radius: 3px;
    margin-top: 0;
  }

  background-color: unset;
  padding-right: 48px;

  button {
    background-color: var(--panel-background);
  }

  img {
    max-width: 30vw;
    box-shadow: 0 0 10px 0px var(--panel-background);
  }

  /* if panel is url link */
  :has(> span) {
    background-color: var(--panel-background);
    padding: 16px 48px 16px 16px;

    button {
      padding: 0;
      top: 50%;
      transform: translateY(-50%);
    }
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
    copyToClipboard([new ClipboardItem({ [blob.type]: blob })])
  }

  const string = JSON.stringify(data, null, 2).replace(/"/g, '').replace(/{|}/g, '').slice(1, -1)
  return (
    <Dialog header={`Share: ${name}`} size="lg" isOpen onClose={() => dispatch(closeShare())}>
      <ShareStyled>
        <span>{link}</span>
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
