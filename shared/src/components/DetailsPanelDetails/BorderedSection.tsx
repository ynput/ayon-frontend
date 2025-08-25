import React from 'react'
import styled from 'styled-components'

const StyledSection = styled.div`
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 8px;
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

const StyledContent = styled.div`
  padding: 8px;
`

interface BorderedSectionProps {
  title: string
  children: React.ReactNode
  headerContent?: React.ReactNode
  contentClassName?: string
}

export const BorderedSection: React.FC<BorderedSectionProps> = ({
  title,
  children,
  headerContent,
  contentClassName,
}) => {
  return (
    <StyledSection>
      <StyledHeader>
        <span>{title}</span>
        {headerContent}
      </StyledHeader>
      <StyledContent className={contentClassName}>
        {children}
      </StyledContent>
    </StyledSection>
  )
}
