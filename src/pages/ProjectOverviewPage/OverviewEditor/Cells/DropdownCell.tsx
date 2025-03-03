import { EnumTemplate, Icon } from '@ynput/ayon-react-components'
import styled from 'styled-components'
const StyledEnumTemplateWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  height: 100%;
  width: 100%;
`

type Props = {
  icon: string
  color: string
  text: string
  handleExpandIconClick: () => void
}

//
const DropdownCell = ({ icon, color, text, handleExpandIconClick }: Props) => {
  return (
    <StyledEnumTemplateWrapper style={{}} onDoubleClick={handleExpandIconClick}>
      <EnumTemplate
        option={{
          color: color,
          icon: icon,
          label: text,
          value: text,
        }}
      />

      <Icon icon="expand_more" onClick={handleExpandIconClick} />
    </StyledEnumTemplateWrapper>
  )
}

export default DropdownCell
