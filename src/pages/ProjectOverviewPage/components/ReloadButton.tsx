import { useProjectTableContext } from '@containers/ProjectTreeTable'
import { Button } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { FC } from 'react'
import styled from 'styled-components'

const StyledButton = styled(Button)`
  /* put over filter dropdown */
  margin-right: -32px;
  position: relative;
  left: -36px;
  z-index: 1000;
  padding: 2px !important;

  /* spin icon */
  &.spinning {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`

interface ReloadButtonProps {}

const ReloadButton: FC<ReloadButtonProps> = ({}) => {
  const { isLoading, reloadTableData } = useProjectTableContext()
  return (
    <StyledButton
      icon={'refresh'}
      className={clsx({ spinning: isLoading })}
      onClick={reloadTableData}
      data-tooltip={'Reload table data'}
      variant="text"
      disabled={isLoading}
    />
  )
}

export default ReloadButton
