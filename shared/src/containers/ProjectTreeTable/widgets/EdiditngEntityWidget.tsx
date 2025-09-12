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
    border-radius: 4px;
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
    const [isSaving, setIsSaving] = useState(false) // Add saving state
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
            // Prevent multiple saves if already saving
            if (isSaving) return

            if (event.key === 'Escape') {
                event.preventDefault()
                event.stopPropagation()
                handleCancel()
            } else if (event.key === 'Enter') {
                event.preventDefault()
                event.stopPropagation()
                handleSave()
            }
        }

        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [label, name, isSaving]) // Add isSaving to dependencies

    const handleSave = useCallback(async () => {
        if (!label.trim() || isSaving) return // Don't save if empty or already saving

        const hasChanges = name !== initialName || label !== initialLabel

        // Exit editing mode immediately (optimistic)
        setEditingCellId(null)

        if (hasChanges) {
            setIsSaving(true)

            try {
                const updates = []

                // Prepare all updates first
                if (name !== initialName) {
                    updates.push({
                        field: 'name',
                        value: name.trim() || generateSystemName(label.trim()),
                        type: entityType,
                        rowId,
                        id: rowId
                    })
                }

                if (label !== initialLabel) {
                    updates.push({
                        field: 'label',
                        value: label.trim(),
                        type: entityType,
                        rowId,
                        id: rowId
                    })
                }

                // Execute all updates in one batch
                if (updates.length > 0) {
                    await updateEntities(updates)
                }
            } catch (error) {
                console.error('Failed to save entity changes:', error)
                // Rollback: re-enter editing mode with original values
                setEditingCellId(`${rowId}:label`)
                setLabel(initialLabel)
                setName(initialName)
                setIsNameManuallyEdited(false)
            } finally {
                setIsSaving(false)
            }
        }
    }, [label, name, initialLabel, initialName, entityType, rowId, updateEntities, setEditingCellId, isSaving])

    const handleCancel = useCallback(() => {
        if (isSaving) return // Don't allow cancel while saving
        onCancel?.()
        setEditingCellId(null)
    }, [onCancel, setEditingCellId, isSaving])

    const handleLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (isSaving) return // Don't allow changes while saving
        const value = e.target.value
        setLabel(value)
        if (!isNameManuallyEdited) {
            setName(generateSystemName(value))
        }
    }, [isNameManuallyEdited, isSaving])

    const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (isSaving) return // Don't allow changes while saving
        setName(e.target.value)
        setIsNameManuallyEdited(true)
    }, [isSaving])

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
                    disabled={isSaving}
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
                    disabled={isSaving}
                />
        </EditingContainer>
    )
}

export default EdiditngEntityWidget
