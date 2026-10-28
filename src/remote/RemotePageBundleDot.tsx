import styled from 'styled-components'
import type { RemotePageBundle } from './useRemoteBundle'

const BUNDLE_LABELS: Record<RemotePageBundle['variant'], string> = {
  staging: 'staging',
  developer: 'dev',
}

const Dot = styled.span`
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
  margin-right: 6px;
  background-color: var(--color-hl-production);

  &.staging {
    background-color: var(--color-hl-staging);
  }
  &.developer {
    background-color: var(--color-hl-developer);
  }

  /* only on the selected tab */
  a:not(.active) & {
    display: none;
  }
`

// Marks a tab whose addon page comes from the staging or dev bundle instead of production
export const RemotePageBundleDot = ({ bundle }: { bundle?: RemotePageBundle }) => {
  if (!bundle) return null

  const tooltip = `Using ${bundle.addonName} ${bundle.addonVersion} from the ${
    BUNDLE_LABELS[bundle.variant]
  } bundle`

  return <Dot className={bundle.variant} data-tooltip={tooltip} />
}
