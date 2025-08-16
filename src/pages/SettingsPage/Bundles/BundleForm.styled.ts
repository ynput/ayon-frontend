import styled from 'styled-components'
import { Panel, FormLayout, Section } from '@ynput/ayon-react-components'

export const StyledPanel = styled(Panel)`
  flex-grow: 1;
  overflow: hidden;
`

export const StyledFormLayout = styled(FormLayout)`
  gap: 8px;
  padding-top: 1px;
  max-width: 900px;
`

export const BundleNameContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`

export const BundleNameInput = styled.div<{ $hasError?: boolean }>`
  flex: 1;
  input {
    width: 100%;
  }

  input {
    ${({ $hasError }) =>
      $hasError &&
      `
      outline: 1px solid var(--color-hl-error);
    `}
  }
`

export const ProjectSwitchContainer = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;

  .switch-body {
    min-width: unset;
  }
`

export const BundleName = styled.h2`
  margin: 0;
`

export const LauncherVersionContainer = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`

export const LauncherVersionTitle = styled.h2`
  margin: 0;
  margin-right: 32px;
`

export const StyledColumns = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 16px;
  overflow: hidden;
  max-width: 1500px;
`

export const AddonListSection = styled.section`
  height: 100%;
  min-width: 500px;
  flex: 1;
`

export const AddonListInnerSection = styled.section`
  height: 100%;
`

export const SidebarSection = styled(Section)`
  overflow: hidden;
  align-items: flex-start;
  min-width: clamp(300px, 25vw, 400px);
  max-width: clamp(300px, 25vw, 400px);
  height: 100%;
  flex-grow: unset;
`

export const DevFieldContainer = {
  flexDirection: 'row' as const,
  gap: 8,
}

export const AssignButtonContainer = {
  justifyContent: 'center' as const,
  width: 'auto' as const,
}
