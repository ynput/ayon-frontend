import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react'
import { CellId } from '../utils/cellUtils'
import useUpdateOverview, {
  InheritFromParent,
  UpdateTableEntities,
} from '../hooks/useUpdateOverview'
import { useProjectTableContext } from './ProjectTableContext'
import { AttributeData } from '../types'
import { toast } from 'react-toastify'

export interface CellEditingContextType {
  editingCellId: CellId | null
  setEditingCellId: (id: CellId | null) => void
  isEditing: (id: CellId) => boolean
  updateEntities: UpdateTableEntities
  inheritFromParent: InheritFromParent
}

const CellEditingContext = createContext<CellEditingContextType | undefined>(undefined)

export const CellEditingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [editingCellId, setEditingCellId] = useState<CellId | null>(null)

  // Memoize these functions to prevent unnecessary re-renders
  const isEditing = useCallback((id: CellId) => id === editingCellId, [editingCellId])

  const { updateEntities, inheritFromParent } = useUpdateOverview()
  const { attribFields } = useProjectTableContext()
  const validateUpdateEntities: UpdateTableEntities = async (entities = []) => {
    try {
      // first validate the values are correct
      for (const { isAttrib, value: rawValue, field } of entities) {
        if (!isAttrib) continue
        const attribute = attribFields.find((attr) => attr.name === field)
        if (!attribute) continue

        // coerce numeric strings into numbers for integer/float types or fail
        let value: any = rawValue
        const { type } = attribute.data
        if (type === 'integer' || type === 'float') {
          if (typeof rawValue === 'string') {
            // empty or non‑numeric strings are invalid
            if (rawValue.trim() === '' || isNaN(Number(rawValue))) {
              throw new Error(`“${field}” must be a valid number`)
            }
            value = type === 'integer' ? parseInt(rawValue, 10) : parseFloat(rawValue)
          } else if (typeof rawValue !== 'number') {
            // any other type is invalid
            throw new Error(`“${field}” must be a valid number`)
          }
        }

        // collect numeric rules from attribute.data
        const validationKeys: (keyof AttributeData)[] = [
          'ge',
          'gt',
          'le',
          'lt',
          'minLength',
          'maxLength',
          'minItems',
          'maxItems',
        ]
        const validationValues = (
          Object.entries(attribute.data) as [keyof AttributeData, any][]
        ).reduce((acc, [key, v]) => {
          if (validationKeys.includes(key)) acc[key] = v as number
          return acc
        }, {} as Record<keyof AttributeData, number>)

        const { ge, gt, le, lt, minLength, maxLength, minItems, maxItems } = validationValues

        if (typeof value === 'number') {
          if (ge != null && value < ge) throw new Error(`“${field}” must be ≥ ${ge}`)
          if (gt != null && value <= gt) throw new Error(`“${field}” must be > ${gt}`)
          if (le != null && value > le) throw new Error(`“${field}” must be ≤ ${le}`)
          if (lt != null && value >= lt) throw new Error(`“${field}” must be < ${lt}`)
        } else if (typeof value === 'string') {
          if (minLength != null && value.length < minLength)
            throw new Error(`“${field}” length must be ≥ ${minLength}`)
          if (maxLength != null && value.length > maxLength)
            throw new Error(`“${field}” length must be ≤ ${maxLength}`)
        } else if (Array.isArray(value)) {
          if (minItems != null && value.length < minItems)
            throw new Error(`“${field}” items must be ≥ ${minItems}`)
          if (maxItems != null && value.length > maxItems)
            throw new Error(`“${field}” items must be ≤ ${maxItems}`)
        }
      }
    } catch (error: any) {
      // if validation fails, show a toast and return
      toast.error(error.message)
      return Promise.resolve()
    }
    // all good – forward to the real updater
    return updateEntities(entities)
  }

  const value = useMemo(
    () => ({
      editingCellId,
      setEditingCellId,
      isEditing,
      updateEntities: validateUpdateEntities,
      inheritFromParent,
    }),
    [editingCellId, isEditing, updateEntities],
  )

  return <CellEditingContext.Provider value={value}>{children}</CellEditingContext.Provider>
}

export const useCellEditing = (): CellEditingContextType => {
  const context = useContext(CellEditingContext)
  if (context === undefined) {
    throw new Error('useCellEditing must be used within a CellEditingProvider')
  }
  return context
}
