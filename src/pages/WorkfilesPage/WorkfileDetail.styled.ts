import styled from 'styled-components'
import { Thumbnail } from '@shared/components'

// a preview, not a strip: the empty slot shows the workfile icon in its middle
export const WorkfileThumbnail = styled(Thumbnail)`
  flex-shrink: 0;
  height: auto;
  aspect-ratio: 16 / 9;
  max-height: 160px;
  border-radius: var(--border-radius-l);

  .type-icon {
    font-size: 32px;
  }
`

// the rows read like the details panel on the other pages: a label column of one width so the
// values line up, and long values end in an ellipsis (hovering shows the whole value and a click
// copies it). The rows are ARC TableRows inside AttributeTable.
export const Attributes = styled.div`
  & > div {
    padding: 0;
  }

  & > div > div {
    display: grid;
    grid-template-columns: 112px minmax(0, 1fr);
    align-items: center;
    gap: var(--base-gap-large);
    min-height: 32px;
    padding: 4px 0;
    border-top: none;
  }

  & > div > div > span:first-child {
    color: var(--md-sys-color-outline);
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* values start at the label column, the hover reveal opens where the value starts */
  & > div > div > div,
  & > div > div > div > div:not(.dropdown) {
    justify-content: flex-start;
    min-width: 0;
    margin-right: 0;
  }

  & > div > div > div > span + span,
  & > div > div > div > div > span + span {
    left: 0;
    right: auto;
  }

  /* ARC's own hover rule misses its "&" and never matches */
  & > div > div > div > span + span:hover,
  & > div > div > div > div > span + span:hover {
    opacity: 1;
    height: auto;
    box-shadow: 0 0 8px 0 rgb(0 0 0 / 20%);
  }
`
