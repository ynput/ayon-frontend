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
import { useSelection } from '@containers/ProjectTreeTable/context/SelectionContext'
import { parseCellId } from '@containers/ProjectTreeTable/utils/cellUtils'
import { useProjectTableContext } from '@containers/ProjectTreeTable/context/ProjectTableContext'
import { EditorTaskNode, MatchingFolder } from '@containers/ProjectTreeTable/utils/types'
import { useOperationsMutation } from '@queries/overview/updateOverview'
import { OperationModel } from '@api/rest/operations'
import { v1 as uuid1 } from 'uuid'
import { toast } from 'react-toastify'
import FolderSequence from '@components/FolderSequence/FolderSequence'
import getSequence from '@helpers/getSequence'

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

type NewEntityType = 'folder' | 'task'

interface EntityForm {
  label: string
  subType: string
}

interface SequenceForm {
  active: boolean
  increment: string
  length: number
  prefix: boolean
  prefixDepth: number
}

interface NewEntityProps {}

const NewEntity: React.FC<NewEntityProps> = () => {
  const [createMore, setCreateMore] = useState(false)
  const { selectedCells } = useSelection()
  const { getEntityById, projectName, projectInfo } = useProjectTableContext()

  const selectedRowIds = Array.from(
    new Set(
      Array.from(selectedCells)
        .map((cellId) => parseCellId(cellId))
        .filter((cell) => cell && cell?.colId === 'name')
        .map((cell) => cell?.rowId) as string[],
    ),
  )

  const selectedEntities = selectedRowIds.map((id) => getEntityById(id))

  const selectedFolders = selectedEntities.filter(
    // @ts-ignore
    (entity) => !entity?.folderId,
  ) as MatchingFolder[]
  const selectedTasks = selectedEntities.filter(
    // @ts-ignore
    (entity) => entity?.folderId,
  ) as EditorTaskNode[]

  // Extract folder IDs from selected folders and tasks
  const folderIdsFromFolders = selectedFolders.map((folder) => folder.id)
  const folderIdsFromTasks = selectedTasks.map((task) => task.folderId)

  // Combine and remove duplicate folder IDs
  // These are the folders to create the new entity in
  const selectedFolderIds = Array.from(new Set([...folderIdsFromFolders, ...folderIdsFromTasks]))

  const isRoot = isEmpty(selectedFolderIds)

  const [nameFocused, setNameFocused] = useState<boolean>(false)
  const [entityType, setEntityType] = useState<NewEntityType | null>(null)
  //   build out form state
  const initData: EntityForm = { label: '', subType: '' }
  const [entityForm, setEntityForm] = useState<EntityForm>(initData)
  const [sequenceForm, setSequenceForm] = useState<SequenceForm>({
    active: true,
    increment: '',
    length: 10,
    prefix: false,
    prefixDepth: 0,
  })

  //   format title
  let title = 'Add New '
  if (isRoot) title += 'Root '
  title += capitalize(entityType || '')

  //   entityType selector
  const typeOptions =
    (entityType === 'folder' ? projectInfo?.folderTypes : projectInfo?.taskTypes) || []

  // Helper function to generate label based on entity type and selected subtype
  const generateLabel = (type: NewEntityType | null, subType: string): string => {
    if (!type || !subType) return ''

    const typeOption = (
      type === 'folder' ? projectInfo?.folderTypes : projectInfo?.taskTypes
    )?.find((option) => option.name === subType)

    if (!typeOption) return ''

    return type === 'folder'
      ? typeOption.shortName || typeOption.name.toLowerCase()
      : typeOption.name.toLowerCase()
  }

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
          newState.label = generateLabel(entityType, value)
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

  const handleNew = (type: NewEntityType) => {
    // set entityType
    setEntityType(type)
    // set any default values
    const typeOptions =
      (type === 'folder' ? projectInfo?.folderTypes : projectInfo?.taskTypes) || []
    const firstType = typeOptions[0]
    const firstName = firstType.name || ''

    // Use the helper function to generate the label
    const initData = {
      subType: firstName,
      label: generateLabel(type, firstName),
    }

    setEntityForm(initData)
  }

  const handleClose = () => {
    // reset state
    setEntityType(null)
    setEntityForm(initData)
  }

  // open dropdown - delay to wait for dialog opening
  const handleShow = () => setTimeout(() => typeSelectRef.current?.open(), 180)

  const [createEntities] = useOperationsMutation()

  // Helper functions for creating operations
  const createEntityOperation = (
    entityType: NewEntityType,
    subType: string,
    name: string,
    label: string,
    parentId?: string,
  ): OperationModel => {
    return {
      type: 'create',
      entityType: entityType,
      data: {
        [`${entityType}Type`]: subType,
        id: uuid1().replace(/-/g, ''),
        name: name.replace(/[^a-zA-Z0-9]/g, ''),
        label: label,
        ...(parentId && { [entityType === 'folder' ? 'parentId' : 'folderId']: parentId }),
      },
    }
  }

  const createSequenceOperations = (
    entityType: NewEntityType,
    subType: string,
    sequence: string[],
    folderIds: string[],
  ): OperationModel[] => {
    // For root folders
    if (folderIds.length === 0 && entityType === 'folder') {
      return sequence.map((name) => createEntityOperation(entityType, subType, name, name))
    }

    // For folders or tasks with parent references
    const operations: OperationModel[] = []
    for (const folderId of folderIds) {
      for (const name of sequence) {
        operations.push(createEntityOperation(entityType, subType, name, name, folderId))
      }
    }
    return operations
  }

  const createSingleOperations = (
    entityType: NewEntityType,
    subType: string,
    label: string,
    folderIds: string[],
  ): OperationModel[] => {
    const sanitizedName = label.replace(/[^a-zA-Z0-9]/g, '')

    // For root folders
    if (folderIds.length === 0 && entityType === 'folder') {
      return [createEntityOperation(entityType, subType, sanitizedName, label)]
    }

    // For folders or tasks with parent references
    return folderIds.map((folderId) =>
      createEntityOperation(entityType, subType, sanitizedName, label, folderId),
    )
  }

  const handleSubmit = async (stayOpen: boolean) => {
    // first check name and entityType valid
    if (!entityType || !entityForm.label) return

    // If we're creating a task and there are no selected folders, show error
    if (entityType === 'task' && selectedFolderIds.length === 0) {
      toast.error('Cannot create a task without selecting a folder')
      return
    }

    let operations: OperationModel[]

    if (sequenceForm.active) {
      // Generate the sequence
      const sequence = getSequence(entityForm.label, sequenceForm.increment, sequenceForm.length)
      operations = createSequenceOperations(
        entityType,
        entityForm.subType,
        sequence,
        selectedFolderIds,
      )
    } else {
      operations = createSingleOperations(
        entityType,
        entityForm.subType,
        entityForm.label,
        selectedFolderIds,
      )
    }

    try {
      await createEntities({
        operationsRequestModel: { operations },
        projectName: projectName,
      }).unwrap()

      if (stayOpen) {
        // focus and select the label input
        if (labelRef.current) {
          labelRef.current.focus()
          labelRef.current.select()
        }
      } else {
        handleClose()
      }
    } catch (error) {}
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

  const addDisabled = !entityForm.label || !entityForm.subType

  return (
    <>
      <StyledCreateButton
        options={[
          { label: 'Folder', value: 'folder', icon: 'create_new_folder', shortcut: 'N' },
          { label: 'Task', value: 'task', icon: 'add_task', shortcut: 'T' },
        ]}
        value={[]}
        onChange={(v: string[]) => handleNew(v[0] as NewEntityType)}
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
      />
      {entityType && (
        <Dialog
          header={title}
          isOpen
          onClose={handleClose}
          onShow={handleShow}
          size={sequenceForm.active ? 'lg' : 'md'}
          footer={
            <Toolbar onFocus={() => setNameFocused(false)} style={{ width: '100%' }}>
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
              <Spacer />
              <span>Create more</span>
              <InputSwitch
                checked={createMore}
                onChange={(e) => setCreateMore((e.target as HTMLInputElement).checked)}
              />
              <SaveButton
                label={`Create ${capitalize(entityType)}`}
                onClick={() => handleSubmit(createMore)}
                active={!addDisabled}
                title="Ctrl/Cmd + Enter"
                data-shortcut="Ctrl/Cmd+Enter"
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
