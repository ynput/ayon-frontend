import styled from 'styled-components'
import { Dialog, Icon } from '@ynput/ayon-react-components'
import { copyToClipboard } from '@shared/util'

export interface ShareDialogProps {
  link: string
  entityLabel: string
  visible: boolean
  onHide: () => void
}

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const Label = styled.span`
  font-size: 13px;
  color: var(--md-sys-color-on-surface);
`

const Row = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 14px;
  border: none;
  border-radius: 8px;
  background: var(--md-sys-color-surface-container-lowest);
  color: var(--md-sys-color-on-surface);
  text-align: left;
  cursor: pointer;
  font: inherit;

  &:hover {
    background: var(--md-sys-color-surface-container-low);
  }

  &:active {
    background: var(--md-sys-color-surface-container);
  }

  .value {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

export const ShareDialog = ({ link, entityLabel, visible, onHide }: ShareDialogProps) => {
  if (!visible) return null

  const markdown = `[AYON - ${entityLabel}](${link})`

  const copy = (value: string) => {
    copyToClipboard(value, true)
    onHide()
  }

  return (
    <Dialog isOpen onClose={onHide} size="sm" header="Share">
      <Body>
        <Field>
          <Label>Link</Label>
          <Row type="button" onClick={() => copy(link)} aria-label="Copy link">
            <span className="value">{link}</span>
            <Icon icon="content_copy" />
          </Row>
        </Field>
        <Field>
          <Label>Markdown Link</Label>
          <Row type="button" onClick={() => copy(markdown)} aria-label="Copy markdown link">
            <span className="value">{markdown}</span>
            <Icon icon="content_copy" />
          </Row>
        </Field>
      </Body>
    </Dialog>
  )
}

export default ShareDialog
