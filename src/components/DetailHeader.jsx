import React, { useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Panel, Button, Dialog } from '@ynput/ayon-react-components'

const HeaderStyled = styled(Panel)`
  gap: 8px;
  align-items: center;
  flex-direction: row;
  justify-content: space-between;

  h2 {
    font-size: 1.1rem;
    margin: 0;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  & > div {
    display: flex;
    gap: 8px;
    align-items: center;
    flex: 1;
    overflow-x: clip;
  }
`

const DetailHeader = ({ children, onClose, style, context, dialogTitle = '' }) => {
  const [showContext, setShowContext] = useState(false)

  return (
    <>
      <Dialog
        header={dialogTitle}
        isOpen={showContext}
        onClose={() => setShowContext(false)}
        size="lg"
      >
        <pre style={{whiteSpace: 'pre-wrap'}} >
          {JSON.stringify(context, null, 2)}
        </pre>
      </Dialog>
      <HeaderStyled style={style}>
        <div>{children}</div>
        {context && (
          <Button
            icon="more_vert"
            variant="text"
            onClick={() => setShowContext(!showContext)}
            data-tooltip="Full context data"
          />
        )}
        {onClose && <Button icon="close" variant="text" onClick={onClose} />}
      </HeaderStyled>
    </>
  )
}

DetailHeader.propTypes = {
  children: PropTypes.node,
  onClose: PropTypes.func,
  style: PropTypes.object,
  dialogTitle: PropTypes.string,
}

export default DetailHeader
