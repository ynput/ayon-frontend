import { SortingDropdownProps } from '@ynput/ayon-react-components'
import { FC } from 'react'
import * as Styled from './SortingSetting.styled'

interface SortingSettingProps extends SortingDropdownProps {}

export const SortingSetting: FC<SortingSettingProps> = ({ title, ...props }) => {
  return (
    <Styled.Container>
      <label>{title}</label>
      <Styled.Dropdown title={'Set sorting'} {...props} />
    </Styled.Container>
  )
}

export default SortingSetting
