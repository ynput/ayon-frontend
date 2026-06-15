import styled from 'styled-components'

export const VersionReview = styled.li`
  list-style: none;
  margin: var(--padding-s) var(--padding-m);
  padding: var(--padding-s) var(--padding-m) var(--padding-s) 0;

  display: flex;
  gap: var(--base-gap-small);

  border: solid 1px currentColor;
  border-radius: var(--border-radius-l);
  user-select: none;

  .date, .user-image {
    flex-shrink: 0;
  }

  &.approve,
  &.approve .icon,
  &.approve .date, {
    color: var(--md-sys-color-tertiary);
  }

  &.request_changes,
  &.request_changes .icon,
  &.request_changes .date, {
    color: var(--md-sys-color-error);
  }
`

export const Body = styled.div`
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  flex: 1;
  gap: var(--base-gap-medium);
  padding: 0px 4px;
  overflow: hidden;
  width: 100%;

  .icon {
    font-variation-settings: 'FILL' 1, 'wght' 300, 'GRAD' 300, 'opsz' 20;
    font-size: 16px;
  }

  [icon='trending_flat'] {
    color: var(--md-sys-color-outline);
    opacity: 0.5;
  }
`

export const Text = styled.span`
  white-space: nowrap;
  font-size: 12px;
  text-overflow: ellipsis;
  flex-shrink: 1;
  overflow: hidden;

  strong {
    font-size: 12px;
    font-weight: 800;
  }
`
