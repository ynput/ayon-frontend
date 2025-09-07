import React from 'react'
import styled from 'styled-components'

const StyledSection = styled.div`
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 8px;
  min-height: auto;
  display: flex;
  flex-direction: column;
`

const StyledHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  min-height: 40px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
`

const StyledContent = styled.div<{ $showHeader: boolean }>`
  padding: ${props => props.$showHeader ? '8px' : '0 8px 8px 8px'};
  flex: 1;
  min-height: ${props => props.$showHeader ? 'calc(300px - 40px)' : '300px !important'};
`

interface BorderedSectionProps {
  title: string
  children: React.ReactNode
  headerContent?: React.ReactNode
  contentClassName?: string
  showHeader?: boolean
}

export const BorderedSection: React.FC<BorderedSectionProps> = ({
  title,
  children,
  headerContent,
  contentClassName,
  showHeader = false,
}) => {
  return (
    <StyledSection>
      {showHeader ? (
        <StyledHeader>
          <span>{title}</span>
          {headerContent}
        </StyledHeader>
      ) : null}
      <StyledContent className={contentClassName} $showHeader={showHeader}>{children}</StyledContent>
    </StyledSection>
  )
}
