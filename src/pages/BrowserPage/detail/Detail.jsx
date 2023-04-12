import { useSelector } from 'react-redux'
import { Section, Toolbar } from 'ayon-react-components-test'

import EntityDetailsContainer from './EntityDetailsContainer'
import { upperFirst } from 'lodash'

const Detail = () => {
  const focused = useSelector((state) => state.context.focused)

  const { type } = focused

  const ids = focused[type + 's'] || []

  return (
    <Section className="wrap">
      <Toolbar>
        <span className="section-header">{upperFirst(type)}</span>
      </Toolbar>
      <EntityDetailsContainer ids={ids} type={type} />
    </Section>
  )
}

export default Detail
