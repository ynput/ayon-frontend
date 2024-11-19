import { DefaultValueTemplate, Dropdown } from '@ynput/ayon-react-components'
import React from 'react'
import * as Styled from './Bundles.styled'
import styled, { css } from 'styled-components'

const DefaultItemStyled = styled.span`
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

const VersionAndPlatformTemplate = ({ version = [], platforms = [] }) => {
  return (
    <DefaultValueTemplate
      value={version}
      childrenCustom={platforms?.map((platform, i) => (
        <Styled.PlatformTag key={platform + '-' + i} $platform={platform}>
          {platform === 'darwin' ? 'macOS' : platform}
        </Styled.PlatformTag>
      ))}
    >
      {version}
    </DefaultValueTemplate>
  )
}

const InstallerSelector = ({ value = [], options, onChange, disabled }) => {
  // find option from value
  const selectedOption = options.find((o) => o.version === value[0])

  return (
    <Dropdown
      {...{ value, options, onChange, disabled }}
      dataKey="version"
      widthExpand
      valueTemplate={() => (
        <VersionAndPlatformTemplate version={value} platforms={selectedOption?.platforms} />
      )}
      itemTemplate={(option, isActive) => (
        <DefaultItemStyled $isSelected={isActive} data-testid={`installer-option-${option.version}`}>
          <span>{option.version}</span>
          {option?.platforms?.map((platform, i) => (
            <Styled.PlatformTag key={platform + '-' + i} $platform={platform}>
              {platform === 'darwin' ? 'macOS' : platform}
            </Styled.PlatformTag>
          ))}
        </DefaultItemStyled>
      )}
    />
  )
}

export default InstallerSelector
