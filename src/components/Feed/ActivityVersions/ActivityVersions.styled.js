import styled from 'styled-components'
import ThumbnailSimple from '@containers/ThumbnailSimple'

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
  display: flex;
  gap: var(--base-gap-large);
  align-items: center;
  justify-content: space-between;
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
  flex-direction: column;
  justify-content: space-between;

  gap: var(--base-gap-small);
`

export const Title = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);

  .date {
    /* by default hide */
    display: none;
  }
`

export const Thumbnail = styled(ThumbnailSimple)`
  width: 74px;
  height: 100%;
  aspect-ratio: 1.7778;
  margin: unset;

  .icon {
    font-size: 24px;
  }

  img {
    object-fit: cover;
  }
`

export const Comment = styled.div`
  margin-top: var(--base-gap-small);
  color: var(--md-sys-color-on-surface-variant);
  line-height: 1.25rem;
  word-break: break-word;
`
