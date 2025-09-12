import React from 'react'
import styled from 'styled-components'

const StyledSection = styled.div<{
  $enableHover: boolean
}>`
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 8px;
  min-height: auto;
  display: flex;
  flex-direction: column;
  transition: background-color 0.2s ease;

  ${(props) =>
    props.$enableHover &&
    `
    &:hover {
      cursor: pointer;
      background-color: var(--md-sys-color-surface-container-low-hover);
    }
  `}
`

const StyledHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  min-height: 40px;
  font-weight: 500;
  color: var(--md-sys-color-outline);
`

const StyledContent = styled.div<{
  $showHeader: boolean
  $withPadding: boolean
  $autoHeight: boolean
}>`
  padding: ${(props) => (props.$withPadding ? '12px' : 0)};
  flex: 1;
  min-height: ${(props) =>
    props.$autoHeight ? 'auto' : props.$showHeader ? 'calc(300px - 40px)' : '300px !important'};
  border-radius: ${(props) => (props.$showHeader ? '0 0 8px 8px' : '8px')};
`

interface BorderedSectionProps {
  title: string
  children: React.ReactNode
  headerContent?: React.ReactNode
  contentClassName?: string
  showHeader?: boolean
  autoHeight?: boolean
  enableHover?: boolean
  withPadding?: boolean
  onClick?: () => void
}

export const BorderedSection: React.FC<BorderedSectionProps> = ({
  title,
  children,
  headerContent,
  contentClassName,
  showHeader = false,
  autoHeight = false,
  enableHover = false,
  withPadding = false,
  onClick,
}) => {
  return (
    <StyledSection $enableHover={enableHover} onClick={onClick}>
      {showHeader ? (
        <StyledHeader>
          <span>{title}</span>
          {headerContent}
        </StyledHeader>
      ) : null}
      <StyledContent
        className={contentClassName}
        $showHeader={showHeader}
        $autoHeight={autoHeight}
        withPadding={withPadding}
      >
        {children}
      </StyledContent>
    </StyledSection>
  )
}
