import styled from 'styled-components'
import { Dropdown } from '@ynput/ayon-react-components'

// read-only in project settings: greyed like other locked fields, but upright like the studio one
export const BundleDropdown = styled(Dropdown)`
  .button {
    font-style: normal;
  }
`

export const DropdownBadge = styled.span`
  border-radius: 3px;
  padding: 2px 4px;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-on-hl);
  background-color: var(--color-hl-developer);
  margin-left: 8px;
  height: 18px;
  min-width: 18px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.staging {
    background-color: var(--color-hl-staging);
  }

  &.production {
    background-color: var(--color-hl-production);
    color: var(--color-on-hl-production);
  }

  &.project {
    background-color: var(--color-hl-project);
    color: black;
  }
`
