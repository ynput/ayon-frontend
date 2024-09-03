import { Dialog, theme } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const FriendlyDialog = styled(Dialog)`
  background-color: var(--md-sys-color-surface-container-high);
  border-radius: var(--border-radius-xxl);
  min-width: min(1000px, 90vw);
  width: max-content;
  max-width: 90vw;
  max-height: unset;

  .header {
    .title {
      ${theme.headlineSmall}
    }
    .message {
      ${theme.bodyMedium}
    }
  }

  button.cancel {
    &:hover {
      background-color: var(--md-sys-color-surface-container-highest-hover);
    }
  }

  .body {
    align-items: center;

    .cards {
      display: flex;
      flex-direction: row;
      gap: var(--base-gap-small);
      justify-content: center;
      align-items: center;
      width: 100%;
    }

    .arrow {
      font-size: 3rem;
    }

    .overrides {
      ${theme.labelLarge}
      margin-top: 16px;
      color: var(--md-sys-color-outline);
    }
  }

  @media (max-width: 1100px) {
    .body {
      .cards {
        flex-direction: column;
        .card {
          width: 100%;
        }
      }

      .arrow {
        rotate: 90deg;
      }
    }
  }
`

export const BundleCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);

  flex: 1;

  background-color: var(--md-sys-color-surface-container);
  padding: var(--padding-l);
  border-radius: var(--border-radius-l);

  .badge {
    display: flex;
    align-items: center;
    gap: var(--base-gap-small);
    .icon {
      color: black;
    }
  }
`

export const Row = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);
`

export const TargetBundle = styled.span`
  padding: 6px 8px;
  flex: 1;
`
