export enum MappingState {
  UNRESOLVED = 'unresolved',
  RESOLVED = 'resolved',
  AUTO_RESOLVED = 'autoresolved',
  ERROR = 'error',
}

export const resolvedStates = new Set([MappingState.AUTO_RESOLVED, MappingState.RESOLVED])
