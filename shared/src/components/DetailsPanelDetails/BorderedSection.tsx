import React from 'react'
import styled from 'styled-components'
import clsx from 'clsx'

const StyledSection = styled.div`
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 8px;
  min-height: auto;
  display: flex;
  flex-direction: column;
  transition: background-color 0.2s ease;

  &.enable-hover:hover {
    cursor: pointer;
    background-color: var(--md-sys-color-surface-container-low-hover);
  }
`

const StyledHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  min-height: 40px;
  color: var(--md-sys-color-outline);
`

const StyledContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;

  &.with-padding {
    padding: 12px;
  }

  &.auto-height {
    min-height: auto;
  }

  &.with-header {
    min-height: calc(300px - 40px);
    border-radius: 0 0 8px 8px;
  }

  &:not(.with-header):not(.auto-height) {
    min-height: 300px !important;
  }

  &:not(.with-header) {
    border-radius: 8px;
  }
`

interface BorderedSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  children: React.ReactNode
  headerContent?: React.ReactNode
  showHeader?: boolean
  autoHeight?: boolean
  enableHover?: boolean
  withPadding?: boolean
  pt?: {
    header?: Partial<React.HTMLAttributes<HTMLDivElement>>
    content?: Partial<React.HTMLAttributes<HTMLDivElement>>
  }
}

export const BorderedSection: React.FC<BorderedSectionProps> = ({
  title,
  children,
  headerContent,
  showHeader = false,
  autoHeight = false,
  enableHover = false,
  withPadding = false,
  onClick,
  className,
  pt,
  ...props
}) => {
  return (
    <StyledSection
      className={clsx(className, { 'enable-hover': enableHover })}
      onClick={onClick}
      {...props}
    >
      {showHeader ? (
        <StyledHeader {...pt?.header}>
          <span>{title}</span>
          {headerContent}
        </StyledHeader>
      ) : null}
      <StyledContent
        {...pt?.content}
        className={clsx(pt?.content?.className, {
          'with-padding': withPadding,
          'auto-height': autoHeight,
          'with-header': showHeader,
        })}
      >
        {children}
      </StyledContent>
    </StyledSection>
  )
}
