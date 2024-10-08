import React, { FC } from 'react'
import { usePiPWindow } from './PiPProvider'
import PiPWindow from './PiPWindow'
import { Dialog } from 'primereact/dialog'
import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

interface PiPWrapperProps {
  children: React.ReactNode
}

const StyledDialog = styled(Dialog)`
  width: 25vw;
  height: 70vh;
  border: solid 1px var(--md-sys-color-outline-variant);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 0 1px 1px #000, 0 11px 15px -7px #0003, 0 24px 38px 3px #00000024,
    0 9px 46px 8px #0000001f;
  &:hover {
    .close {
      opacity: 1;
    }
  }
`

const StyledClose = styled(Button)`
  width: 26px;
  height: 26px;
  margin-left: auto;

  .icon {
    font-size: 15px;
    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 200, 'opsz' 20;
  }
  background-color: unset;
  opacity: 0;
  border-radius: 100%;
  transition: opacity 400ms, background-color 400ms;
  &:hover {
    background-color: #3d3e40;
  }
`

const PiPWrapper: FC<PiPWrapperProps> = ({ children }) => {
  const { pipWindow, pipId, isSupported, closePipWindow } = usePiPWindow()

  // attach pipId to id of children
  const pipChildren =
    pipId && React.isValidElement<{ id?: string }>(children)
      ? React.cloneElement(children, { id: pipId })
      : children

  //   open using fallback dialog
  if (!isSupported && pipId) {
    return (
      <StyledDialog
        header={<StyledClose icon="close" className="close" onClick={closePipWindow} />}
        headerStyle={{
          padding: 4,
          backgroundColor: '#202124',
          border: 'none',
          height: 33,
        }}
        contentStyle={{ overflow: 'hidden', height: 'revert-layer', padding: 8, border: 'none' }}
        maskStyle={{ pointerEvents: 'none', userSelect: 'none', backgroundColor: 'unset' }}
        visible={true}
        closeOnEscape={false}
        pt={{
          closeButton: {
            style: { display: 'none' },
          },
          footer: {
            style: { padding: 0, border: 'none' },
          },
        }}
        onHide={closePipWindow}
        position="right"
      >
        {pipChildren}
      </StyledDialog>
    )
  }

  return (
    pipWindow && (
      <PiPWindow pipWindow={pipWindow}>
        <div className="pipRoot">{pipChildren}</div>
      </PiPWindow>
    )
  )
}

export default PiPWrapper
