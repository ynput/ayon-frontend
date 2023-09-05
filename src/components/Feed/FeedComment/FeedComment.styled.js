import styled, { css } from 'styled-components'

export const Comment = styled.li`
  /* reset default */
  list-style: none;
  margin: 0;
  padding: 0;

  display: flex;
  flex-direction: column;
  gap: 4px;

  width: 100%;
`

export const Body = styled.div`
  background-color: var(--md-sys-color-surface-container);
  border-radius: var(--border-radius-m);
  padding: 8px;
  position: relative;

  /* remove first and last margins */
  & > *:first-child {
    margin-top: 0;
  }

  & > *:last-child {
    margin-bottom: 0;
  }

  a {
    color: var(--md-sys-color-primary);
  }
`

export const Attachments = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const attachmentBase = css`
  height: 100px;
  width: 100px;
  object-fit: contain;
  padding: 4px;
  cursor: pointer;
  position: relative;

  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-high);

  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
  }

  &:active {
    background-color: var(--md-sys-color-surface-container-high-active);
  }
`

export const AttachmentImg = styled.img`
  ${attachmentBase}
`

export const AttachmentFile = styled.a`
  ${attachmentBase}

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  .icon {
    margin-bottom: 20px;
    font-size: 32px;
    color: var(--md-sys-color-outline);
  }
`

export const Name = styled.span`
  position: absolute;
  bottom: 4px;
  left: 0;
  right: 0;
  text-align: center;
  /* break text */
  overflow-wrap: break-word;
  color: var(--md-sys-color-outline);
`
