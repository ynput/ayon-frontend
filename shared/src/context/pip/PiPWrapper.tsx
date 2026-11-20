import React, { FC } from 'react'
import { usePiPWindow } from './PiPContextInstance'
import PiPWindow from './PiPWindow'
import { Dialog } from 'primereact/dialog'
import styled from 'styled-components'

export interface PiPWrapperProps {
  children: React.ReactNode
}

// the panel is the whole dialog: no title bar or padding, the panel has its own close button
const StyledDialog = styled(Dialog)`
  position: relative;
  width: 480px;
  height: min(720px, 90vh);
  border: solid 1px var(--md-sys-color-outline-variant);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 0 1px 1px light-dark(var(--md-sys-color-outline-variant), #000),
    0 11px 15px -7px #0003, 0 24px 38px 3px #00000024, 0 9px 46px 8px #0000001f;
`

export const PiPWrapper: FC<PiPWrapperProps> = ({ children }) => {
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
        // an invisible strip along the top edge to drag the dialog by
        headerStyle={{
          position: 'absolute',
          inset: '0 0 auto 0',
          height: 8,
          padding: 0,
          background: 'transparent',
          border: 'none',
          cursor: 'move',
          zIndex: 1,
        }}
        contentStyle={{ overflow: 'hidden', height: '100%', padding: 0, border: 'none' }}
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
