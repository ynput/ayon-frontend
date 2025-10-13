import { OperationModel } from '@shared/api'

/**
 * Extracts unique entity IDs from operations
 */
export const getUpdatedEntityIds = (
  operations: Pick<OperationModel, 'entityId'>[],
): string[] => {
  return [...new Set(operations.map((op) => op.entityId).filter(Boolean))] as string[]
}