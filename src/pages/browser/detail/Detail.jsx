import { useDispatch, useSelector } from 'react-redux'
import { Section, Toolbar, Button } from '@ynput/ayon-react-components'

import EntityDetailsContainer from './EntityDetailsContainer'
import styled, { css } from 'styled-components'
import { upperFirst } from 'lodash'
import { setFocusedType } from '/src/features/context'

const TabStyled = styled(Button)`
  font-size: 1.1rem;
  padding: 8px 14px;

  /* isActive */
  ${({ isActive }) =>
    isActive &&
    css`
      background-color: var(--panel-background);
      text-decoration: underline;

      /* remove hover effect */
      &:hover {
        background-color: var(--panel-background);
      }
      /* remove focus outline */
      &:focus {
        outline: none;
      }
    `}
`

const Detail = () => {
  const focused = useSelector((state) => state.context.focused)
  const dispatch = useDispatch()

  const { type } = focused
  const queryType = type === 'representation' ? 'version' : type

  const ids = focused[queryType + 's'] || []

  let tabs = [type]
  // set tabs for different types
  if (focused.subsets?.length) {
    tabs = ['subset', 'version', 'representation']
  }

  // plural tabs
  const pluralTabs = ['version', 'representation']

  const handleTabClick = (tab) => {
    if (tab == type) return
    dispatch(setFocusedType(tab))
  }

  return (
    <Section className="wrap">
      <Toolbar>
        {tabs.map(
          (tab) =>
            tab && (
              <TabStyled
                label={upperFirst(tab) + (pluralTabs.includes(tab) ? 's' : '')}
                isActive={tab == type}
                key={tab}
                onClick={() => handleTabClick(tab)}
              />
            ),
        )}
      </Toolbar>
      <EntityDetailsContainer ids={ids} type={queryType} isRep={type === 'representation'} />
    </Section>
  )
}

export default Detail
