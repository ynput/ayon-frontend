import { Button, FormRow } from '@ynput/ayon-react-components'
import React from 'react'
import styled from 'styled-components'

const StyledFormRow = styled(FormRow)`
  .field {
    flex-direction: row;
    display: flex;
    align-items: center;
    gap: 8px;

    & > span {
      flex: 1;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      margin-right: 16px;
    }

    & > button {
      width: 100px;
      justify-content: flex-start;
    }
  }
`

const BundleDepPackage = ({ children, label }) => {
  return (
    <StyledFormRow label={label}>
      <span>
        {children || '(NONE)'}
        {/* <span> (author)</span> */}
      </span>
      <Button label={children ? 'Rebuild' : 'Build'} icon="sync" disabled />
      <Button label="Upload zip" icon="folder_zip" disabled />
    </StyledFormRow>
  )
}

export default BundleDepPackage
