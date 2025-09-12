import React, { useState, useEffect, useRef, useCallback } from 'react'
import styled from 'styled-components'
import {useCellEditing} from "@shared/containers";

// Helper: generate system name
const generateSystemName = (displayName: string): string => {
    return displayName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
}

const EditingContainer = styled.div`
  background: var(--md-sys-color-surface-container-lowest);
  border: 2px solid var(--md-sys-color-primary);
  padding: 8px;
  width: 350px;
`


const InputLabel = styled.label`
  font-size: 12px;
  color: var(--md-sys-color-outline);
`

const StyledInput = styled.input`
  width: 100%;
  border: none;
  background-color: var(--md-sys-color-surface-container-lowest);
  color: var(--md-sys-color-on-surface);
    &:focus {
    outline: none;
    }
`

const ErrorText = styled.div`
  font-size: 11px;
  color: var(--md-sys-color-error);
`
interface InlineEditingWidgetProps {
    cellId: string
    rowId: string
    entityType: string
    initialName: string
    initialLabel?: string
    onCancel?: () => void
}

const EdiditngEntityWidget: React.FC<InlineEditingWidgetProps> = ({
                                                                     cellId,
                                                                     rowId,
                                                                     entityType,
                                                                     initialName,
                                                                     initialLabel = '',
                                                                     onCancel
                                                                 }) => {
    const [label, setLabel] = useState(initialLabel)
    const [name, setName] = useState(initialName)
    const [isNameManuallyEdited, setIsNameManuallyEdited] = useState(false)
    const { setEditingCellId, updateEntities } = useCellEditing()
    const widgetRef = useRef<HTMLDivElement>(null)
    const labelInputRef = useRef<HTMLInputElement>(null)

    // Auto-generate name from label (display name)
    useEffect(() => {
        if (!isNameManuallyEdited && label) {
            setName(generateSystemName(label))
        }
    }, [label, isNameManuallyEdited])

    // Reset when props change
    useEffect(() => {
        setLabel(initialLabel)
        setName(initialName)
        setIsNameManuallyEdited(false)
    }, [initialLabel, initialName])

    useEffect(() => {
        // Focus and select the first input when component mounts
        if (labelInputRef.current) {
            const timer = setTimeout(() => {
                labelInputRef.current?.focus()
                labelInputRef.current?.select()
            }, 0)
            return () => clearTimeout(timer)
        }
    }, [])

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleCancel()
            } else if (event.key === 'Enter') {
                handleSave()
            }
        }

        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [label, name])

    const handleSave = async () => {
        if (!label.trim()) return // Don't save if label is empty

        const hasChanges = name !== initialName || label !== initialLabel

        if (hasChanges) {
            // Update name if changed
            if (name !== initialName) {
                await updateEntities([
                    {
                        field: 'name',
                        value: name.trim() || generateSystemName(label.trim()),
                        type: entityType,
                        rowId,
                        id: rowId
                    }
                ])
            }

            // Update label if changed
            if (label !== initialLabel) {
                await updateEntities([
                    {
                        field: 'label',
                        value: label.trim(),
                        type: entityType,
                        rowId,
                        id: rowId
                    }
                ])
            }
        }

        setEditingCellId(null)
    }

    const handleCancel = () => {
        onCancel?.()
        setEditingCellId(null)
    }

    const handleLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setLabel(value)
        if (!isNameManuallyEdited) {
            setName(generateSystemName(value))
        }
    }, [isNameManuallyEdited])

    const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value)
        setIsNameManuallyEdited(true)
    }, [])


    return (
        <EditingContainer ref={widgetRef} onClick={(e) => e.stopPropagation()}>
                <StyledInput
                    ref={labelInputRef}
                    id={`${cellId}-label`}
                    type="text"
                    value={label}
                    onChange={handleLabelChange}
                    className={!label.trim() ? 'error' : ''}
                    placeholder="Enter display name"
                    style={{paddingBottom: '6px'}}
                />
                {!label.trim() && (
                    <ErrorText>Label is required</ErrorText>
                )}
                <InputLabel htmlFor={`${cellId}-name`}>
                    Name
                </InputLabel>
                <StyledInput
                    id={`${cellId}-name`}
                    type="text"
                    value={name}
                    onChange={handleNameChange}
                    className="system-name"
                    placeholder="system_name_with_underscores"
                />
        </EditingContainer>
    )
}

export default EdiditngEntityWidget
