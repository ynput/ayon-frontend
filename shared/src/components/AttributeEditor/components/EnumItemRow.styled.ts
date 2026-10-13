import styled from 'styled-components'

export const EnumItemRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  overflow: hidden;
  height: 20px;
  flex: none;

  .label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  img {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    object-fit: cover;
  }

  .icon-slot {
    flex: none;
    width: 20px;
  }
`
