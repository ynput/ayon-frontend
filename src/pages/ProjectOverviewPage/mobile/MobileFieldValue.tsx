import { ValuePill } from '@shared/components/ValuePill'
import { BooleanValue } from '@shared/components/DoneCheckbox/BooleanValue'
import * as Styled from './MobileOverview.styled'
import type { TaskFieldValue } from './MobileTaskRowHelpers'

type Props = {
  value: TaskFieldValue
}

const MobileFieldValue = ({ value }: Props) => (
  <Styled.TaskField>
    <span className="label">{value.label}</span>
    {value.boolean !== undefined ? (
      <BooleanValue value={value.boolean} className="boolean" />
    ) : value.pills ? (
      value.pills.map((pill, index) => <ValuePill key={index} variant="tinted" {...pill} />)
    ) : (
      <span className="value">{value.text}</span>
    )}
  </Styled.TaskField>
)

export default MobileFieldValue
