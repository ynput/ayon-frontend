import { Icon, SwitchButton } from '@ynput/ayon-react-components'
import { FC } from 'react'

interface AdvancedFiltersPlaceholderProps {
  onClick?: () => void
}

const AdvancedFiltersPlaceholder: FC<AdvancedFiltersPlaceholderProps> = ({ onClick }) => {
  return (
    <>
      <SwitchButton
        label={
          <>
            <Icon icon="bolt" />
            Exclude
          </>
        }
        value={false}
        variant="primary"
        onClick={onClick}
      />
      <SwitchButton
        label={
          <>
            <Icon icon="bolt" />
            Match all
          </>
        }
        value={false}
        variant="primary"
        onClick={onClick}
      />
    </>
  )
}

export default AdvancedFiltersPlaceholder
