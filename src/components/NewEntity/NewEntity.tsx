import React, { useState, useRef, KeyboardEvent } from 'react'
import { capitalize, isEmpty } from 'lodash'
import {
  InputText,
  SaveButton,
  Spacer,
  Toolbar,
  Dialog,
  DropdownRef,
  Dropdown,
  Icon,
  InputSwitch,
} from '@ynput/ayon-react-components'
import styled from 'styled-components'
import TypeEditor from './TypeEditor'
import checkName from '@helpers/checkName'
import ShortcutWidget from '@components/ShortcutWidget'
import { useSelectionContext, useProjectTableContext } from '@shared/ProjectTreeTable'
import { parseCellId } from '@shared/ProjectTreeTable/utils/cellUtils'
import { EditorTaskNode, MatchingFolder } from '@shared/ProjectTreeTable'
import FolderSequence from '@components/FolderSequence/FolderSequence'
import { EntityForm, NewEntityType, useNewEntityContext } from '@context/NewEntityContext'
import { ProjectModel } from '@api/rest/project'
import useCreateEntityShortcuts from '@hooks/useCreateEntityShortcuts'

const ContentStyled = styled.div`
  display: flex;
  align-items: center;
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

interface NewEntityProps {
  disabled?: boolean
}

const NewEntity: React.FC<NewEntityProps> = ({ disabled }) => {
  const {
    entityType,
    setEntityType,
    entityForm,
    setEntityForm,
    sequenceForm,
    setSequenceForm,
    onCreateNew,
    onOpenNew,
  } = useNewEntityContext()

  const [createMore, setCreateMore] = useState(false)
  const { selectedCells } = useSelectionContext()
  const { getEntityById, projectInfo } = useProjectTableContext()

  const { selectedFolderIds, selectedFolders } = React.useMemo(() => {
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
      .filter(
        // @ts-ignore
        (entity) => !entity?.folderId,
      )
      .filter(Boolean) as MatchingFolder[]
    const selectedTasks = selectedEntities
      .filter(
        // @ts-ignore
        (entity) => entity?.folderId,
      )
      .filter(Boolean) as EditorTaskNode[]

    // Extract folder IDs from selected folders and tasks
    const folderIdsFromFolders = selectedFolders.map((folder) => folder.id)
    const folderIdsFromTasks = selectedTasks.map((task) => task.folderId)

    // Combine and remove duplicate folder IDs
    // These are the folders to create the new entity in
    const selectedFolderIds = Array.from(new Set([...folderIdsFromFolders, ...folderIdsFromTasks]))

    return { selectedFolderIds, selectedFolders }
  }, [selectedCells, getEntityById])

  const isRoot = isEmpty(selectedFolderIds)

  const [nameFocused, setNameFocused] = useState<boolean>(false)
  //   build out form state
  const initData: EntityForm = { label: '', subType: '' }

  //   format title
  let title = 'Add New '
  if (isRoot) title += 'Root '
  title += capitalize(entityType || '')

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
        // If name field is empty or matches any of the current type options,
        // update it with the new type name
        const currentNameLower = newState.label.toLowerCase()
        const shouldUpdateName =
          currentNameLower === '' ||
          typeOptions.some(
            (option) =>
              currentNameLower.includes(option.name?.toLowerCase()) ||
              (option.shortName && currentNameLower.includes(option.shortName?.toLowerCase())),
          )

        if (shouldUpdateName) {
          // Use the helper function to generate the label
          newState.label = generateLabel(entityType, value, projectInfo)
        }
      }

      // Focus the label input after type selection
      setTimeout(() => {
        labelRef.current?.focus()
      }, 100)
    } else if (id === 'label') {
      // Update name based on the label (sanitizing it)
      newState.label = checkName(value)
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
  }

  // open dropdown - delay to wait for dialog opening
  const handleShow = () => setTimeout(() => typeSelectRef.current?.open(), 180)

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (stayOpen: boolean) => {
    setIsSubmitting(true)
    await onCreateNew(selectedFolderIds)
    setIsSubmitting(false)

    if (stayOpen) {
      // focus and select the label input
      if (labelRef.current) {
        labelRef.current.focus()
        labelRef.current.select()
      }
    } else {
      handleClose()
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
        <Dialog
          header={title}
          isOpen
          onClose={handleClose}
          onShow={handleShow}
          size={sequenceForm.active ? 'lg' : 'md'}
          style={{ maxWidth: sequenceForm.active ? 'unset' : 430 }}
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
                title="Ctrl/Cmd + Enter"
                data-shortcut="Ctrl/Cmd+Enter"
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
              parentLabel={selectedFolders[0]?.label}
              prefixDepth={sequenceForm.prefixDepth}
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
              <TypeEditor
                value={[entityForm.subType]}
                onChange={(v: string) => handleChange(v, 'subType')}
                options={typeOptions}
                style={{ width: 160 }}
                ref={typeSelectRef}
                onFocus={handleTypeSelectFocus}
                onClick={() => setNameFocused(false)}
              />
              <InputText
                value={entityForm.label}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange(e.target.value, 'label')
                }
                ref={labelRef}
                onFocus={() => setNameFocused(true)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                  handleKeyDown(e as unknown as KeyboardEvent, true)
                }
                style={{ flex: 1 }}
              />
            </ContentStyled>
          )}
        </Dialog>
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

  return type === 'folder'
    ? typeOption.shortName || typeOption.name.toLowerCase()
    : typeOption.name.toLowerCase()
}
