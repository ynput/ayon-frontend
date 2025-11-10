import ThumbnailSimple from '@shared/components/ThumbnailSimple'
import styled from 'styled-components'

export const Container = styled.li`
  /* reset default */
  list-style: none;
  margin: 0;
  padding: 0;

  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);

  width: 100%;
  padding: 8px;
`

export const Card = styled.div`
  border-radius: var(--border-radius-m);
  padding: var(--padding-m);

  background-color: var(--md-sys-color-surface-container);

  cursor: pointer;
  &:hover {
    color: var(--md-sys-color-on-surface);
    background-color: var(--md-sys-color-surface-container-hover);

    /* show date */
    .date {
      display: inline;
    }
  }
`

export const Content = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--base-gap-small);
  overflow: hidden;
  min-width: 0;

  > div:first-child {
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }
`

export const Title = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--base-gap-small);
  overflow: hidden;
  flex: 1;
  min-width: 0;

  /* Product name text that can be truncated */
  > span:not(.date) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex-shrink: 1;
    min-width: 0;
    max-width: 100%;
  }

  .date {
    /* by default hide */
    display: none;
    flex: 1;
  }
`

export const Thumbnail = styled(ThumbnailSimple)`
  width: 74px;
  min-width: 74px;
  height: unset;
  aspect-ratio: 1.7778;
  margin: unset;

  .icon {
    font-size: 24px;
  }

  img {
    object-fit: cover;
  }
`

export const VersionName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  min-width: 0;
`

export const Comment = styled.div`
  margin-top: var(--base-gap-small);
  color: var(--md-sys-color-outline);
  word-break: break-word;
`
