import React, { useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Panel } from '@ynput/ayon-react-components'
import { Dialog } from 'primereact/dialog'

const HeaderStyled = styled(Panel)`
  gap: 10px;
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
    gap: 10px;
    align-items: center;
    flex: 1;
  }

  /* icon */
  span {
    cursor: pointer;
  }
`

const DetailHeader = ({ children, onClose, style, context }) => {
  const [showContext, setShowContext] = useState(false)

  return (
    <>
      <Dialog header="User Context" visible={showContext} onHide={() => setShowContext(false)}>
        <pre>{JSON.stringify(context, null, 2)}</pre>
      </Dialog>
      <HeaderStyled style={style}>
        <div>{children}</div>
        {context && (
          <span className="material-symbols-outlined" onClick={() => setShowContext(!showContext)}>
            more_vert
          </span>
        )}
        {onClose && (
          <span className="material-symbols-outlined" onClick={onClose}>
            close
          </span>
        )}
      </HeaderStyled>
    </>
  )
}

DetailHeader.propTypes = {
  children: PropTypes.node,
  onClose: PropTypes.func,
  style: PropTypes.object,
}

export default DetailHeader
