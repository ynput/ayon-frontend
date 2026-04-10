import styled from 'styled-components'
import { Popup as UserPopup } from '../UserTooltip/UserTooltip.styled'

export const Popup = styled(UserPopup)`
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  min-width: 180px;
`

export const Header = styled.span`
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);

  .icon {
    font-size: 20px;
  }
`

export const HeaderContent = styled.span`
  display: flex;
  flex-direction: column;

  span {
    white-space: nowrap;
  }

  .label {
    color: var(--md-sys-color-outline);
    font-size: 0.85em;
  }
`

export const MembersList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
`

export const MemberItem = styled.li`
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);

  .thumbnail {
    width: 24px;
    height: 24px;

    .icon {
      font-size: 14px;
    }
  }

  span {
    white-space: nowrap;
    font-size: 0.9em;
  }
`

export const MoreLabel = styled.span`
  color: var(--md-sys-color-outline);
  font-size: 0.85em;
  padding-left: 32px;
`
