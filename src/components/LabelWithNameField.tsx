import { Icon, InputText } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { KeyboardEvent, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

export interface LabelWithNameFieldProps {
  labelValue: string
  nameValue: string
  labelError?: string
  nameError?: string
  autoFocus?: boolean
  isSubmitting?: boolean
  disabled?: boolean
  nameLocked?: boolean
  labelLabel?: string
  nameLabel?: string
  labelPlaceholder?: string
  lockedTitle?: string
  editableTitle?: string
  nameInfo?: string
  getGeneratedName: (label: string) => string
  onLabelChange: (value: string) => void
  /** Called when label is committed (blur) — use for auto-save */
  onLabelCommit?: (value: string) => void
  onNameChange: (value: string) => void
  /** Called when name is committed (blur or Enter) — use for auto-save */
  onNameCommit?: (value: string) => void
  variant?: 'inline' | 'stacked'
}

export const LabelWithNameField = ({
  labelValue,
  nameValue,
  labelError,
  nameError,
  autoFocus = true,
  isSubmitting = false,
  disabled = false,
  nameLocked = false,
  labelLabel = 'Label',
  nameLabel = 'Name',
  labelPlaceholder,
  lockedTitle = 'Name is fixed after creation.',
  editableTitle = 'Click to edit the generated name.',
  nameInfo,
  getGeneratedName,
  onLabelChange,
  onLabelCommit,
  onNameChange,
  onNameCommit,
  variant = 'stacked',
}: LabelWithNameFieldProps) => {
  const generatedName = getGeneratedName(labelValue)
  const [isEditingName, setIsEditingName] = useState(false)
  const [draftName, setDraftName] = useState(nameValue)
  const nameInputRef = useRef<HTMLInputElement | null>(null)
  const [hasCustomName, setHasCustomName] = useState(
    Boolean(nameValue) && nameValue !== generatedName,
  )

  useEffect(() => {
    setDraftName(nameValue)
  }, [nameValue])

  useEffect(() => {
    if (!isEditingName) {
      return
    }

    nameInputRef.current?.focus()
    nameInputRef.current?.select()
  }, [isEditingName])

  useEffect(() => {
    if (nameLocked) {
      setIsEditingName(false)
      return
    }

    if (!hasCustomName && nameValue !== generatedName) {
      onNameChange(generatedName)
    }
  }, [generatedName, hasCustomName, nameLocked, nameValue, onNameChange])

  const startEditingName = () => {
    if (disabled || nameLocked) {
      return
    }

    setDraftName(nameValue || generatedName)
    setIsEditingName(true)
  }

  const commitName = (resolvedValue?: string) => {
    const normalizedDraftName = getGeneratedName(resolvedValue ?? draftName)
    const resolvedName = normalizedDraftName || generatedName

    onNameChange(resolvedName)
    onNameCommit?.(resolvedName)
    setHasCustomName(Boolean(resolvedName) && resolvedName !== generatedName)
    setIsEditingName(false)
  }

  const cancelEditingName = () => {
    setDraftName(nameValue)
    setIsEditingName(false)
  }

  const handleNameInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.stopPropagation()
      commitName()
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      cancelEditingName()
    }
  }

  return (
    <InputsContainer className={clsx({ inline: variant === 'inline' })}>
      <LabelRow className="label-row">
        <Label>{labelLabel}</Label>
      </LabelRow>
      <div className="field-group">
        <InputText
          value={labelValue}
          onChange={(e) => onLabelChange(e.target.value)}
          onBlur={() => onLabelCommit?.(labelValue)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onLabelCommit?.(labelValue)
            }
          }}
          placeholder={labelPlaceholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={clsx({ submitting: isSubmitting })}
        />
        {labelError && <ErrorText>{labelError}</ErrorText>}

        <NameRow>
          <Label>{nameLabel}</Label>
          {nameInfo ? (
            <InfoIcon icon="info" data-tooltip={nameInfo} data-tooltip-delay={0} />
          ) : null}
          {isEditingName ? (
            <NameInput
              ref={nameInputRef}
              value={draftName}
              onChange={(event) => {
                setDraftName(event.target.value)
              }}
              onBlur={() => {
                commitName()
              }}
              onKeyDown={handleNameInputKeyDown}
              disabled={disabled}
              className={clsx({ submitting: isSubmitting })}
            />
          ) : (
            <NameDisplay
              className={clsx({ active: !nameLocked && !disabled })}
              onClick={() => {
                startEditingName()
              }}
              title={nameLocked ? lockedTitle : editableTitle}
            >
              <NameValue title={nameLocked ? lockedTitle : editableTitle}>
                {nameValue || generatedName}
              </NameValue>
              {!nameLocked && !disabled && <Icon icon="edit" className="icon" />}
            </NameDisplay>
          )}
        </NameRow>
        {nameError && <ErrorText>{nameError}</ErrorText>}
      </div>
    </InputsContainer>
  )
}

// ─── Styled Components ────────────────────────────────────────────────────────

const InputsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  width: 100%;

  label {
    white-space: nowrap;
  }

  .field-group {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  &.inline {
    flex-direction: row;
    align-items: flex-start;
    gap: var(--base-gap-large);

    .label-row {
      min-width: 96px;
      padding-top: 8px;
    }

    .field-group {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--base-gap-small);
      min-width: 0;
    }
  }
`

const LabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
`

const Label = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
  display: block;
`

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  word-break: break-all;
  margin-top: 4px;
`

const InfoIcon = styled(Icon)`
  cursor: help;
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant);
`

const NameDisplay = styled.span`
  position: relative;
  padding: 0 4px;
  display: inline-flex;
  align-items: center;
  min-height: 20px;
  gap: 4px;
  border: 0;
  background: transparent;
  border-radius: var(--border-radius-m);
  color: var(--md-sys-color-on-surface-variant);
  user-select: text;

  .icon {
    display: none;
    font-size: 12px;
    color: var(--md-sys-color-on-surface-variant);
  }

  &:hover,
  &:focus-visible {
    background-color: var(--md-sys-color-surface-container-low);
    outline: none;
  }

  &.active {
    cursor: pointer;
    &:hover .icon,
    &:focus-visible .icon {
      display: inline-flex;
    }
  }
`

const NameValue = styled.span`
  height: 20px;
  font-size: 12px;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  color: var(--md-sys-color-on-surface-variant);
  user-select: text;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 400;
`

const NameInput = styled(InputText)`
  height: 24px;
  width: 100%;
  min-height: 0;
  border: 0;
  padding: 0 4px;
  background: transparent;

  input {
    color: var(--md-sys-color-on-surface-variant);
    font-size: 12px;
    outline: none;

    &:focus {
      background: var(--md-sys-color-surface-container-low);
      border: none;
      outline: 1px solid var(--md-sys-color-primary);
    }
  }
`

export const ErrorText = styled.div`
  font-size: 12px;
  color: var(--md-sys-color-error);
`
