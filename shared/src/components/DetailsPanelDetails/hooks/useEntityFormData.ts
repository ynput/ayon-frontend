import { useState, useEffect } from 'react'
import { getMixedState } from '@shared/util'
import type { DetailsPanelEntityData } from '@shared/api'
import type { EntityForm } from '../types'
import { visibleFields } from '../types'

export const useEntityFormData = (entities: DetailsPanelEntityData[], isLoading: boolean) => {
  const [mixedFields, setMixedFields] = useState<string[]>([])
  const [formData, setFormData] = useState<EntityForm | null>(null)

  const buildInitialForm = () => {
    const valuesByField: Record<string, any[]> = {}
    const mixedFieldsSet = new Set<string>()

    entities.forEach((entity) => {
      const mappedEntity: EntityForm = {
        id: entity.id,
        name: entity.name,
        label: entity.label,
        entityType: entity.entityType as 'folder' | 'task' | 'product' | 'version',
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        projectName: entity.projectName,
        status: entity.status,
        tags: entity.tags || [],
        path: entity.path,
        folderType: entity.folder?.folderType,
        productType: entity.product?.productType,
        taskType: entity.task?.taskType,
        description: entity.attrib?.description?.toString() ?? '',
      }

      Object.keys(mappedEntity).forEach((key) => {
        if (visibleFields.includes(key as keyof EntityForm)) {
          valuesByField[key] = valuesByField[key] || []
          valuesByField[key].push((mappedEntity as any)[key])
        }
      })

      if (entity.attrib) {
        Object.keys(entity.attrib).forEach((key) => {
          if (key !== 'description') {
            const attribKey = `attrib.${key}`
            valuesByField[attribKey] = valuesByField[attribKey] || []
            valuesByField[attribKey].push(entity.attrib?.[key])
          }
        })
      }
    })

    const formData = Object.entries(valuesByField).reduce((result, [key, values]) => {
      const { value, isMixed } = getMixedState(values)
      result[key] = value

      if (isMixed) {
        mixedFieldsSet.add(key)
      }

      return result
    }, {} as Record<string, any>)

    setFormData(formData as EntityForm)
    setMixedFields(Array.from(mixedFieldsSet))
  }

  useEffect(() => {
    if (isLoading || entities.length === 0) return
    buildInitialForm()
  }, [entities, isLoading])

  const updateFormData = (key: string, value: any) => {
    setFormData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [key]: value,
      }
    })
  }

  const clearMixedField = (fieldName: string) => {
    setMixedFields((prev) => prev.filter((field) => field !== fieldName))
  }

  return {
    formData,
    mixedFields,
    updateFormData,
    clearMixedField,
  }
}
