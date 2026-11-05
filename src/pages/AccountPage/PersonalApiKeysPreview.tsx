// Without a Power Pack licence, the profile page shows what personal API keys look like, faded
// out. Power Pack's own section (profile.section, powerFeature) shows instead when licensed.
import { PowerpackButton } from '@shared/components'
import { usePowerpack } from '@shared/context'
import { Icon, Panel } from '@ynput/ayon-react-components'
import styled from 'styled-components'

const PreviewPanel = styled(Panel)`
  cursor: pointer;

  .title {
    display: flex;
    align-items: center;
    gap: var(--base-gap-small);

    .bolt {
      color: var(--md-sys-color-tertiary);
    }
  }

  .mock {
    display: flex;
    flex-direction: column;
    gap: var(--base-gap-small);
    opacity: 0.4;
    pointer-events: none;
    user-select: none;
  }

  .key {
    display: flex;
    flex-direction: column;
    padding: 4px 8px;
    border-radius: var(--border-radius-m);
    background-color: var(--md-sys-color-surface-container-high);

    .meta {
      color: var(--md-sys-color-outline);
      font-size: 12px;
    }
  }

  .create {
    align-self: flex-end;
  }
`

// made-up keys: nothing here is real or creates a key
const MOCK_KEYS = [
  { label: 'Render farm', meta: '8f2c*****3f9a · expires in 60 days' },
  { label: 'Sync script', meta: 'c41d*****b07c · expires in 12 days' },
]

export const PersonalApiKeysPreview = () => {
  const { setPowerpackDialog } = usePowerpack()

  return (
    <PreviewPanel
      data-testid="personal-api-keys-preview"
      onClick={() => setPowerpackDialog('personalApiKeys')}
    >
      <b className="title">
        Personal API keys
        <Icon icon="bolt" filled className="bolt" />
      </b>
      <div className="mock" aria-hidden>
        {MOCK_KEYS.map((key) => (
          <div className="key" key={key.label}>
            <span>{key.label}</span>
            <span className="meta">{key.meta}</span>
          </div>
        ))}
      </div>
      <PowerpackButton
        className="create"
        feature="personalApiKeys"
        icon="add"
        label="Create API key"
        variant="filled"
        onClick={(e) => e.stopPropagation()}
      />
    </PreviewPanel>
  )
}
