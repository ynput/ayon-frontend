import React, { KeyboardEvent, useRef, useState } from 'react'
import { capitalize, isEmpty } from 'lodash'
import {
  Dialog,
  Dropdown,
  DropdownRef,
  Icon,
  InputSwitch,
  SaveButton,
  Spacer,
  Toolbar,
} from '@ynput/ayon-react-components'
import styled from 'styled-components'
import TypeEditor from './TypeEditor'
import { checkName, parseAndFormatName, getPlatformShortcutKey, KeyMode } from '@shared/util'
import ShortcutWidget from '@components/ShortcutWidget'
import {
  EditorTaskNode,
  MatchingFolder,
  useProjectTableContext,
  useSelectionCellsContext,
} from '@shared/containers/ProjectTreeTable'
import { parseCellId } from '@shared/containers/ProjectTreeTable/utils/cellUtils'
import { type OperationResponseModel, type ProjectModel } from '@shared/api'
import FolderSequence from '@components/FolderSequence/FolderSequence'
import { EntityForm, NewEntityType, useNewEntityContext } from '@context/NewEntityContext'
import useCreateEntityShortcuts from '@hooks/useCreateEntityShortcuts'
import { useSlicerContext } from '@context/SlicerContext'
import NewEntityForm, { InputLabel, InputsContainer } from '@components/NewEntity/NewEntityForm.tsx'
import { toast } from 'react-toastify'

const StyledDialog = styled(Dialog)`
  .body {
    overflow: visible;
  }
`

const ContentStyled = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--base-gap-large);
  form {
    input:first-child {
      margin-right: 8px;
    }
  }
`

const StyledCreateButton = styled(Dropdown)`
  overflow: visible;
  min-width: fit-content;
  .button {
    display: flex;
    align-items: center;
    gap: var(--base-gap-small);
    padding: 0 8px;
    background-color: var(--md-sys-color-primary);
    &,
    .icon {
      color: var(--md-sys-color-on-primary);
    }
    min-width: 100px;
    justify-content: center;

    &:hover {
      background-color: var(--md-sys-color-primary-hover);
    }
  }
`

const StyledCreateItem = styled.span`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  padding: 0 8px;
  height: 32px;
  width: 100%;

  .label {
    flex: 1;
    margin-right: 24px;
  }
`

export interface NewEntityProps {
  disabled?: boolean
  onNewEntities?: (ops: OperationResponseModel[], stayOpen: boolean) => void
}

const NewEntity: React.FC<NewEntityProps> = ({ disabled, onNewEntities }) => {
  const {
    entityType,
    setEntityType,
    entityForm,
    setEntityForm,
    sequenceForm,
    setSequenceForm,
    onCreateNew,
    onOpenNew,
    config,
  } = useNewEntityContext()

  const [createMore, setCreateMore] = useState(false)
  const { selectedCells } = useSelectionCellsContext()
  const {
    rowSelection: slicerSelection,
    rowSelectionData: slicerSelectionData,
    sliceType,
  } = useSlicerContext()
  const { getEntityById, projectInfo } = useProjectTableContext()

  const [selectedFolderIds, selectedEntitiesLabels] = React.useMemo(() => {
    const selectedRowIds = Array.from(
      new Set(
        Array.from(selectedCells)
          .map((cellId) => parseCellId(cellId))
          .filter((cell) => cell && cell?.colId === 'name')
          .map((cell) => cell?.rowId) as string[],
      ),
    )

    const selectedEntities = selectedRowIds.map((id) => getEntityById(id))

    const selectedFolders = selectedEntities
      .filter((entity) => entity?.entityType === 'folder')
      .filter(Boolean) as MatchingFolder[]
    const selectedTasks = selectedEntities
      .filter((entity) => entity?.entityType === 'task')
      .filter(Boolean) as EditorTaskNode[]

    // Extract folder IDs from selected folders and tasks
    const folderIdsFromFolders = selectedFolders.map((folder) => folder.id)
    // get parent folder ids from tasks
    const folderIdsFromTasks = selectedTasks.map((task) => task.folderId)

    // Combine and remove duplicate folder IDs
    // These are the folders to create the new entity in
    const selectedFolderIds = Array.from(new Set([...folderIdsFromFolders, ...folderIdsFromTasks]))

    // if no folders or tasks are selected, try to get the selected folder from the slicer
    if (!selectedFolderIds.length && sliceType === 'hierarchy') {
      // add the selected folder ids from the slicer
      const selectedFolderIdsFromSlicer = Object.keys(slicerSelection)
      const selectedEntitiesLabels = Object.entries(slicerSelectionData)
        .filter(([id]) => selectedFolderIdsFromSlicer.includes(id))
        .map(([, data]) => data.label || data.name)
        .filter(Boolean)
      return [selectedFolderIdsFromSlicer, selectedEntitiesLabels]
    } else {
      const selectedEntitiesLabels = selectedEntities
        .map((e) => e?.label || e?.name)
        .filter(Boolean)
      return [selectedFolderIds, selectedEntitiesLabels]
    }
  }, [selectedCells, slicerSelection, sliceType, entityType, getEntityById])

  const parentLabel = selectedEntitiesLabels[0] || ''

  const isRoot = isEmpty(selectedFolderIds)

  const [nameFocused, setNameFocused] = useState<boolean>(false)
  const [nameManuallyEdited, setNameManuallyEdited] = useState<boolean>(false)
  //   build out form state
  const initData: EntityForm = { label: '', subType: '', name: '' }

  //   format title
  const getDialogTitle = () => {
    let title = 'Add New '
    if (isRoot) title += 'Root '
    title += capitalize(entityType || '')
    if (!isRoot) {
      if (selectedEntitiesLabels.length > 2) {
        title +=
          ' - ' +
          selectedEntitiesLabels.slice(0, 2).join(', ') +
          ` +${selectedEntitiesLabels.length - 2} more`
      } else {
        title += ' - ' + selectedEntitiesLabels.join(', ')
      }
    }
    return title
  }

  //   entityType selector
  const typeOptions =
    (entityType === 'folder' ? projectInfo?.folderTypes : projectInfo?.taskTypes) || []

  // handlers
  const handleChange = (value: any, id?: keyof EntityForm) => {
    if (!id) return

    let newState = { ...entityForm }
    newState[id] = value

    if (value && id === 'subType') {
      // User selected a new entity type from the dropdown
      // Find the corresponding type option
      const typeOption = typeOptions.find((option) => option.name === value)

      if (typeOption) {
        newState.label = typeOption.name
        // If name field is empty or matches any of the current type options,
        // update it with the new type name
        const currentNameLower = newState.name.toLowerCase()
        const shouldUpdateName =
          currentNameLower === '' ||
          typeOptions.some(
            (option) =>
              currentNameLower.includes(option.name?.toLowerCase()) ||
              (option.shortName && currentNameLower.includes(option.shortName?.toLowerCase())),
          )
        if (shouldUpdateName) {
          // Generate name for backend (lowercase and sanitized)
          newState.name = parseAndFormatName(typeOption.name, config)
        }
      }

      // Reset manual editing flag when type changes - allow auto-generation again
      setNameManuallyEdited(false)

      // Focus the label input after type selection
      setTimeout(() => {
        labelRef.current?.focus()
      }, 100)
    } else if (id === 'label') {
      // Update name based on the label (sanitizing it)
      newState.label = value
      // Only auto-generate name if user hasn't manually edited it
      if (!nameManuallyEdited) {
        newState.name = parseAndFormatName(value, config)
      }
    } else if (id === 'name') {
      // User is manually editing the name
      setNameManuallyEdited(true)
      newState.name = value
    }

    setEntityForm(newState)
  }

  const handleSeqChange = (value: any) => {
    setEntityForm({ ...entityForm, label: value.base, subType: value.type })
    setSequenceForm({
      ...sequenceForm,
      increment: value.increment,
      length: value.length,
      prefix: value.prefix,
      prefixDepth: value.prefixDepth,
    })
  }

  //   refs
  const typeSelectRef = useRef<DropdownRef>(null)
  const labelRef = useRef<HTMLInputElement>(null)

  const handleClose = () => {
    // reset state
    setEntityType(null)
    setEntityForm(initData)
    setSequenceForm((prev) => ({ ...prev, active: false }))
    setNameManuallyEdited(false)
  }

  // open dropdown - delay to wait for dialog opening
  const handleShow = () => setTimeout(() => typeSelectRef.current?.open(), 180)

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (stayOpen: boolean) => {
    // validate the name
    const { valid, error } = checkName(entityForm.name)
    if (!valid) {
      toast.error(error || 'Invalid name')
      return
    }

    setIsSubmitting(true)
    try {
      const resOperations = await onCreateNew(selectedFolderIds)

      // callback function
      onNewEntities?.(resOperations, stayOpen)

      if (stayOpen) {
        // focus and select the label input
        if (labelRef.current) {
          labelRef.current.focus()
          labelRef.current.select()
        }
      } else {
        handleClose()
      }
    } catch (error) {
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent, lastInput?: boolean) => {
    e?.stopPropagation()
    if (e.key === 'Enter') {
      if (lastInput && !e.shiftKey) {
        handleSubmit(false)
        setCreateMore(false)
      } else if (e.ctrlKey || e.metaKey) {
        handleSubmit(false)
        setCreateMore(false)
      } else if (e.shiftKey) {
        handleSubmit(true)
        setCreateMore(true)
      }
    } else if (e.key === 'Escape') {
      handleClose()
    }
  }

  const handleTypeSelectFocus = () => {
    if (nameFocused) {
      setNameFocused(false)
      // super hacky way to fix clicking on entityType select when name is focused
      setTimeout(() => {
        typeSelectRef.current?.open()
      }, 100)
    }
  }

  const options: {
    label: string
    value: string
    type: NewEntityType
    icon: string
    shortcut?: string
    isSequence?: boolean
  }[] = [
    { label: 'Folder', value: 'folder', type: 'folder', icon: 'create_new_folder', shortcut: 'N' },
    {
      label: 'Folder sequence',
      value: 'sequence',
      type: 'folder',
      icon: 'topic',
      shortcut: 'M',
      isSequence: true,
    },
    { label: 'Task', value: 'task', type: 'task', icon: 'add_task', shortcut: 'T' },
  ]

  // Use the keyboard shortcuts hook
  useCreateEntityShortcuts({ options, onOpenNew })

  const handleOpenFromMenu = (value: string) => {
    // get the full option object
    const selectedOption = options.find((option) => option.value === value)
    if (selectedOption) {
      onOpenNew(selectedOption.type, { isSequence: selectedOption.isSequence })
    }
  }

  const addDisabled = !entityForm.label || !entityForm.subType

  return (
    <>
      <StyledCreateButton
        options={options}
        value={[]}
        onChange={(v: string[]) => handleOpenFromMenu(v[0])}
        valueTemplate={() => (
          <>
            <Icon icon="add" />
            <span>Create</span>
          </>
        )}
        itemTemplate={(option) => (
          <StyledCreateItem>
            <Icon icon={option.icon} />
            <span className="label">{option.label}</span>
            <ShortcutWidget>{option.shortcut}</ShortcutWidget>
          </StyledCreateItem>
        )}
        itemStyle={{
          paddingRight: 16,
        }}
        disabled={disabled}
        data-tooltip={disabled ? 'Enable hierarchy to create new entity' : 'Create new entity'}
      />
      {entityType && (
        <StyledDialog
          header={getDialogTitle()}
          isOpen
          onClose={handleClose}
          onShow={handleShow}
          size={sequenceForm.active ? 'lg' : 'md'}
          style={{ maxWidth: sequenceForm.active ? 'unset' : 430 }}
          enableBackdropClose={false}
          footer={
            <Toolbar onFocus={() => setNameFocused(false)} style={{ width: '100%' }}>
              {entityType === 'folder' && (
                <>
                  <span>Sequence</span>
                  <InputSwitch
                    checked={sequenceForm.active}
                    onChange={(e) =>
                      setSequenceForm({
                        ...sequenceForm,
                        active: (e.target as HTMLInputElement).checked,
                      })
                    }
                  />
                </>
              )}
              <Spacer />
              <span>Create more</span>
              <InputSwitch
                checked={createMore}
                onChange={(e) => setCreateMore((e.target as HTMLInputElement).checked)}
              />
              <SaveButton
                label={`Create ${capitalize(entityType)}`}
                onClick={() => handleSubmit(createMore)}
                active={!addDisabled || isSubmitting}
                data-shortcut={getPlatformShortcutKey('Enter', [KeyMode.Ctrl])}
                saving={isSubmitting}
              />
            </Toolbar>
          }
          onKeyDown={(e: React.KeyboardEvent) => handleKeyDown(e as KeyboardEvent)}
          onClick={(e: React.MouseEvent) => {
            const target = e.target as HTMLElement
            target.tagName !== 'INPUT' && setNameFocused(false)
          }}
        >
          {sequenceForm.active ? (
            // @ts-ignore
            <FolderSequence
              base={entityForm.label}
              type={entityForm.subType}
              increment={sequenceForm.increment}
              length={sequenceForm.length}
              prefix={sequenceForm.prefix}
              prefixDepth={sequenceForm.prefixDepth}
              parentLabel={parentLabel}
              entityType="folder"
              nesting={false}
              onChange={handleSeqChange}
              isRoot={isRoot}
              typeSelectRef={typeSelectRef}
              // @ts-ignore
              onLastInputKeydown={(e) => handleKeyDown(e, true)}
              folders={projectInfo?.folderTypes || []}
            />
          ) : (
            <ContentStyled>
              <InputsContainer>
                <InputLabel>Type</InputLabel>
                <TypeEditor
                  value={[entityForm.subType]}
                  onChange={(v: string) => handleChange(v, 'subType')}
                  options={typeOptions}
                  style={{ width: 160 }}
                  ref={typeSelectRef}
                  onFocus={handleTypeSelectFocus}
                  onClick={() => setNameFocused(false)}
                />
              </InputsContainer>
              <NewEntityForm
                handleChange={handleChange}
                entityForm={entityForm}
                labelRef={labelRef}
                setNameFocused={setNameFocused}
                handleKeyDown={handleKeyDown}
              />
            </ContentStyled>
          )}
        </StyledDialog>
      )}
    </>
  )
}

export default NewEntity

// Helper function to generate label based on entity type and selected subtype
export const generateLabel = (
  type: NewEntityType | null,
  subType: string,
  projectInfo: ProjectModel | undefined,
): string => {
  if (!type || !subType) return ''

  const typeOption = (type === 'folder' ? projectInfo?.folderTypes : projectInfo?.taskTypes)?.find(
    (option) => option.name === subType,
  )

  if (!typeOption) return ''

  return type === 'folder' ? typeOption.shortName || typeOption.name : typeOption.name
}
