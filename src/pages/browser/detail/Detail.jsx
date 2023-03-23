import { useSelector } from 'react-redux'
import { Section, Toolbar } from '@ynput/ayon-react-components'

import EntityDetailsContainer from './EntityDetailsContainer'

const Detail = () => {
  const focused = useSelector((state) => state.context.focused)
  const { type } = focused

  const ids = focused[type + 's'] || []

  let header = type ? type.charAt(0).toUpperCase() + type.slice(1) : ''

  return (
    <Section className="wrap">
      <Toolbar>
        <span className="section-header">{header}</span>
      </Toolbar>
      <EntityDetailsContainer ids={ids} type={type} />
    </Section>
  )
}

export default Detail
