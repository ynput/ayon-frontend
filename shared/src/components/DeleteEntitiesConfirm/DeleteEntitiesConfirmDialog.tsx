import { KeyboardEvent, useMemo, useState } from 'react'
import { Button } from '@ynput/ayon-react-components'
import {
  DELETE_CONFIRM_THRESHOLD,
  DELETE_TYPE_ORDER,
  DeleteConfirmContent,
  sumExpectedCounts,
  type ExpectedDeleteCounts,
} from './DeleteConfirmContent'
import type { DeletableEntityType } from '@shared/context/DeleteEntitiesContext'
import * as Styled from './DeleteEntitiesConfirmDialog.styled'

export type DeleteConfirmPayload = {
  entityLabel: string
  childrenDetails: string[]
  // everything the delete removes, cascaded folder children included
  expectedCounts: ExpectedDeleteCounts
  // set when a single entity is selected — its name is typed instead of counts,
  // unless its children push the total above the threshold
  expectedName?: string
  deleteLabel?: string
}

export type DeleteEntitiesConfirmDialogProps = {
  payload: DeleteConfirmPayload
  onConfirm: () => void
  onCancel: () => void
}

const matchesCount = (value: string | undefined, expected: number): boolean => {
  const trimmed = (value ?? '').trim()
  return trimmed !== '' && Number(trimmed) === expected
}

export const DeleteEntitiesConfirmDialog = ({
  payload,
  onConfirm,
  onCancel,
}: DeleteEntitiesConfirmDialogProps) => {
  const {
    entityLabel,
    childrenDetails,
    expectedCounts,
    expectedName,
    deleteLabel = 'Delete forever',
  } = payload

  const [nameValue, setNameValue] = useState('')
  const [countValues, setCountValues] = useState<Partial<Record<DeletableEntityType, string>>>({})

  const countTypes = useMemo(
    () => DELETE_TYPE_ORDER.filter((type) => (expectedCounts[type] || 0) > 0),
    [expectedCounts],
  )
  const expectedTotal = useMemo(() => sumExpectedCounts(expectedCounts), [expectedCounts])

  // counts win whenever the delete removes more than one entity, cascaded children
  // included — name typing only guards a delete of exactly one entity
  const requiresCounts = expectedTotal > DELETE_CONFIRM_THRESHOLD
  const requiresName = !!expectedName && !requiresCounts
  const isConfirmed = requiresCounts
    ? countTypes.every((type) => matchesCount(countValues[type], expectedCounts[type] as number))
    : requiresName
      ? nameValue.trim() === expectedName
      : true

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && isConfirmed) {
      e.preventDefault()
      onConfirm()
    }
  }

  return (
    <Styled.StyledDialog
      size="md"
      isOpen
      header={`${deleteLabel} ${entityLabel}`}
      onClose={onCancel}
      footer={
        // keydown lives here, not on the dialog — dialog spreads rest props over its own
        // handler and would lose escape-to-close
        <Styled.FooterContainer onKeyDown={handleKeyDown}>
          {requiresName && (
            <>
              <Styled.FooterLabel htmlFor="delete-confirm-name-input">
                To confirm delete action, type '{expectedName}' in the box below
              </Styled.FooterLabel>
              <Styled.ConfirmInput
                id="delete-confirm-name-input"
                data-testid="delete-confirm-name-input"
                autoFocus
                value={nameValue}
                placeholder={expectedName}
                onChange={(e) => setNameValue(e.target.value)}
              />
            </>
          )}
          {requiresCounts && (
            <>
              <Styled.FooterLabel as="p">
                To confirm, type how many of each will be deleted, children included
              </Styled.FooterLabel>
              <Styled.CountRows>
                {countTypes.map((type, index) => (
                  <Styled.CountRow key={type}>
                    <span>{`${type[0].toUpperCase()}${type.slice(1)}s - ${
                      expectedCounts[type]
                    }`}</span>
                    <Styled.CountInput
                      data-testid={`delete-confirm-count-${type}`}
                      autoFocus={index === 0}
                      inputMode="numeric"
                      value={countValues[type] ?? ''}
                      placeholder={`Number of ${type}s`}
                      onChange={(e) =>
                        setCountValues((prev) => ({ ...prev, [type]: e.target.value }))
                      }
                    />
                  </Styled.CountRow>
                ))}
              </Styled.CountRows>
            </>
          )}
          <Styled.FooterActions>
            <Button label="Cancel" onClick={onCancel} />
            <Button
              data-testid="delete-confirm-submit"
              variant="danger"
              label={deleteLabel}
              onClick={onConfirm}
              disabled={!isConfirmed}
            />
          </Styled.FooterActions>
        </Styled.FooterContainer>
      }
    >
      <DeleteConfirmContent
        entityLabel={entityLabel}
        childrenDetails={childrenDetails}
        totalLine={
          expectedTotal > DELETE_CONFIRM_THRESHOLD
            ? // versions cascaded from products are not countable, so the total is a floor
              `This deletes ${
                (expectedCounts.product || 0) > 0 ? 'at least ' : ''
              }${expectedTotal} entities in total.`
            : undefined
        }
      />
    </Styled.StyledDialog>
  )
}
