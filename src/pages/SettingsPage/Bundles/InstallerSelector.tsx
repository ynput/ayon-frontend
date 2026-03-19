import { DefaultValueTemplate, Dropdown } from '@ynput/ayon-react-components'
import React, { ReactNode } from 'react'
import * as Styled from './Bundles.styled'
import styled, { css } from 'styled-components'

type Platform = 'linux' | 'windows' | 'darwin' | string

type InstallerOption = {
  version: string
  platforms?: Platform[]
}

type InstallerSelectorProps = {
  value?: string[]
  options: InstallerOption[]
  onChange: (value: string[]) => void
  disabled?: boolean
}

const DefaultItemStyled = styled.span<{ $isSelected?: boolean }>`
  display: flex;
  gap: var(--base-gap-large);
  align-items: center;
  height: 30px;
  padding: 0 8px;
  padding-right: 40px;

  /* first child flex 1 */
  & > :first-child {
    flex: 1;
  }

  ${({ $isSelected }) =>
    $isSelected &&
    css`
      background-color: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      /* remove hover */
      &:hover {
        background-color: var(--md-sys-color-primary-container-hover);
      }
      :active {
        background-color: var(--md-sys-color-primary-container-active);
      }
    `}
`

const VersionAndPlatformTemplate: React.FC<{
  version?: string[]
  platforms?: Platform[]
}> = ({ version = [], platforms = [] }) => {
  const PlatformTag: any = Styled.PlatformTag
  return (
    <DefaultValueTemplate
      value={version}
      childrenCustom={platforms?.map((platform, i) => (
        // styled in JS file; cast to any to allow transient prop
        <PlatformTag key={platform + '-' + i} $platform={platform}>
          {platform === 'darwin' ? 'macOS' : platform}
        </PlatformTag>
      ))}
    >
      {version}
    </DefaultValueTemplate>
  )
}

const InstallerSelector: React.FC<InstallerSelectorProps> = ({
  value = [],
  options,
  onChange,
  disabled,
}) => {
  // find option from value
  const selectedOption = options.find((o) => o.version === value[0])

  return (
    <Dropdown
      {...{ value, options, onChange, disabled }}
      dataKey="version"
      widthExpand
      valueTemplate={(): ReactNode => (
        <VersionAndPlatformTemplate version={value} platforms={selectedOption?.platforms} />
      )}
      itemTemplate={(option: InstallerOption, isActive: boolean): ReactNode => {
        const PlatformTag: any = Styled.PlatformTag
        return (
          <DefaultItemStyled
            $isSelected={isActive}
            data-testid={`installer-option-${option.version}`}
          >
            <span>{option.version}</span>
            {option?.platforms?.map((platform, i) => (
              <PlatformTag key={platform + '-' + i} $platform={platform}>
                {platform === 'darwin' ? 'macOS' : platform}
              </PlatformTag>
            ))}
          </DefaultItemStyled>
        )
      }}
    />
  )
}

export default InstallerSelector
