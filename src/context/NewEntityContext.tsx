import React, { createContext, useState, ReactNode, useContext } from 'react'
import { OperationModel } from '@api/rest/operations'
import { v1 as uuid1 } from 'uuid'
import { toast } from 'react-toastify'
import getSequence from '@helpers/getSequence'
import { ProjectModel } from '@api/rest/project'
import { generateLabel } from '@components/NewEntity/NewEntity'
import { useOperationsMutation } from '@queries/overview/updateOverview'

export type NewEntityType = 'folder' | 'task'

export interface EntityForm {
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

interface NewEntityContextProps {
  entityType: NewEntityType | null
  setEntityType: React.Dispatch<React.SetStateAction<NewEntityType | null>>
  entityForm: EntityForm
  setEntityForm: React.Dispatch<React.SetStateAction<EntityForm>>
  sequenceForm: SequenceForm
  setSequenceForm: React.Dispatch<React.SetStateAction<SequenceForm>>
  onCreateNew: (selectedFolderIds: string[], projectName: string) => Promise<void>
  onOpenNew: (type: NewEntityType, projectInfo: ProjectModel | undefined) => void
}

export const NewEntityContext = createContext<NewEntityContextProps | undefined>(undefined)

interface NewEntityProviderProps {
  children: ReactNode
}

export const NewEntityProvider: React.FC<NewEntityProviderProps> = ({ children }) => {
  const [entityType, setEntityType] = useState<NewEntityType | null>(null)

  const initData: EntityForm = { label: '', subType: '' }
  const [entityForm, setEntityForm] = useState<EntityForm>(initData)
  const [sequenceForm, setSequenceForm] = useState<SequenceForm>({
    active: false,
    increment: '',
    length: 10,
    prefix: false,
    prefixDepth: 0,
  })

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

  const [createEntities] = useOperationsMutation()

  const onCreateNew: NewEntityContextProps['onCreateNew'] = async (
    selectedFolderIds,
    projectName,
  ) => {
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
    } catch (error) {}
  }

  const onOpenNew: NewEntityContextProps['onOpenNew'] = (type, projectInfo) => {
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
      label: generateLabel(type, firstName, projectInfo),
    }

    setEntityForm(initData)
  }

  const value: NewEntityContextProps = {
    entityType,
    setEntityType,
    entityForm,
    setEntityForm,
    sequenceForm,
    setSequenceForm,
    onCreateNew,
    onOpenNew,
  }

  return <NewEntityContext.Provider value={value}>{children}</NewEntityContext.Provider>
}

export const useNewEntityContext = () => {
  const context = useContext(NewEntityContext)
  if (!context) {
    throw new Error('useNewEntityContext must be used within a NewEntityProvider')
  }
  return context
}
