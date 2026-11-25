import React from 'react'
import clsx from 'clsx'
import styled from 'styled-components'
import type { AttributeField } from '../DetailsPanelAttributes/DetailsPanelAttributesEditor'
import { NoMatches } from '../DetailsPanelAttributes/DetailsPanelAttributesEditor.styled'
import { matchesFieldSearch } from '../DetailsPanelAttributes/fieldSearch'
import { copyToClipboard, formatDateTime } from '@shared/util'
import { Button, BorderedSection } from '@ynput/ayon-react-components'
import { FieldLabel } from './FieldLabel'
import { UserImage } from '../UserImage/UserImage'

const StyledRow = styled.div`
  display: grid;
  grid-template-columns: minmax(80px, 40%) minmax(0, 1fr) 32px;
  row-gap: 2px;
  column-gap: 4px;
  align-items: center;
  min-height: 32px;
  position: relative;

  .copy-icon {
    opacity: 0;
    width: 32px;
    height: 32px;
    padding: 2px;

    &:hover {
      background-color: transparent !important;
    }
  }

  &:hover .copy-icon {
    opacity: 1;
  }

  /* what the entity is, its creation and its last update, each apart */
  &.separated {
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px solid var(--md-sys-color-outline-variant);
  }
`

// rows of a block sit together, a line between blocks; anything else is the first block
const FIELD_BLOCKS: Record<string, number> = {
  createdAt: 1,
  createdBy: 1,
  updatedAt: 2,
  updatedBy: 2,
}
const fieldBlock = (name: string) => FIELD_BLOCKS[name] ?? 0

const StyledValue = styled.div`
  text-align: left;
  color: var(--md-sys-color-on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  justify-self: end;
  font-size: 14px;
  width: 100%;

  &:has(img) {
    display: flex;
    align-items: center;
    gap: 6px;
  }
`

const StyledShimmer = styled.div`
  height: 20px;
  background: var(--md-sys-color-surface-container-low);
  border-radius: 4px;
  animation: shimmer 1.5s infinite;

  @keyframes shimmer {
    0% {
      opacity: 0.5;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.5;
    }
  }
`

type DetailsField = Pick<AttributeField, 'name' | 'data' | 'hidden'>

interface DetailsSectionProps {
  fields: DetailsField[]
  form: Record<string, any>
  mixedFields?: string[]
  isLoading: boolean
  users?: { name: string; fullName?: string | null }[]
  /** the Details tab's search: only the fields whose label, name or value as shown match */
  search?: string
  title?: string
  /** a line between what the entity is, its creation and its last update */
  separateBlocks?: boolean
}

export const DetailsSection: React.FC<DetailsSectionProps> = ({
  fields,
  form,
  mixedFields = [],
  isLoading,
  users = [],
  search,
  title = 'Details',
  separateBlocks,
}) => {
  const formatValue = (value: any, fieldName: string): string => {
    if (value === null || value === undefined) {
      return '-'
    }

    if (fieldName === 'createdAt' || fieldName === 'updatedAt') {
      return formatDateTime(value) || value.toString()
    }

    return value.toString()
  }

  if (isLoading) {
    return (
      <BorderedSection title={title} withPadding>
        {Array.from({ length: 6 }).map((_, index) => (
          <StyledRow key={index}>
            <StyledShimmer style={{ width: '80px' }} />
            <StyledShimmer style={{ width: '120px', justifySelf: 'end' }} />
            <div style={{ width: '24px' }} />
          </StyledRow>
        ))}
      </BorderedSection>
    )
  }

  const rows = fields
    .filter((field) => !field.hidden)
    .map((field) => {
      const fieldValue = form[field.name]
      const isMixed = mixedFields.includes(field.name)
      const displayValue = isMixed ? 'Multiple values' : formatValue(fieldValue, field.name)
      const isAuthor = ['createdBy', 'updatedBy'].includes(field.name)
      const author =
        isAuthor && !isMixed ? users.find((user) => user.name === fieldValue) : undefined
      return { field, fieldValue, isMixed, displayValue, author }
    })
    // found by what the row shows too: a formatted date, an author's full name
    .filter(({ field, fieldValue, displayValue, author }) =>
      matchesFieldSearch(field, fieldValue, search, [displayValue, author?.fullName]),
    )

  return (
    <BorderedSection title={title} autoHeight showHeader withPadding>
      {!rows.length && search && <NoMatches>No matching details</NoMatches>}
      {rows.map(({ field, fieldValue, isMixed, displayValue, author }, index) => {
        const startsBlock =
          separateBlocks &&
          index > 0 &&
          fieldBlock(field.name) !== fieldBlock(rows[index - 1].field.name)
        return (
          <StyledRow key={field.name} className={clsx({ separated: startsBlock })}>
            <FieldLabel name={field.name} data={field.data} showDetailedTooltip={true} />
            <StyledValue
              style={{
                color: isMixed
                  ? 'var(--md-sys-color-on-surface-variant)'
                  : 'var(--md-sys-color-on-surface)',
                fontStyle: isMixed ? 'italic' : 'normal',
              }}
            >
              {author && (
                <UserImage name={author.name} fullName={author.fullName || undefined} size={20} />
              )}
              {author ? author.fullName || author.name : displayValue}
            </StyledValue>
            <Button
              className="copy-icon"
              variant="text"
              icon="content_copy"
              onClick={(e) => {
                e.stopPropagation()
                const valueToDisplay =
                  fieldValue === null || fieldValue === undefined ? '' : fieldValue
                copyToClipboard(valueToDisplay.toString(), true)
              }}
            />
          </StyledRow>
        )
      })}
    </BorderedSection>
  )
}
