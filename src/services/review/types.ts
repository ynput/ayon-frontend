export type Summary = {
  activityId?: string
  sourceFileId?: string
  targetFileId?: string
  versionId?: string
}

import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
import {
  GetReviewablesForVersionApiResponse,
  ReviewableModel,
  ReviewableProcessingStatus,
} from '@/api/rest'
import api from '@/api'

// UPDATE GetReviewablesForVersionApiResponse to include the new processing type
// Define a type alias for Processing to extend it correctly
interface Processing extends ReviewableProcessingStatus {
  progress?: number
}

// Extend UpdatedReviewable with the new Processing type
export interface ReviewableResponse extends Omit<ReviewableModel, 'processing'> {
  processing: Processing // Use the new Processing type here
}

// Extend the main response interface
interface UpdatedGetReviewablesForVersionApiResponse
  extends Omit<GetReviewablesForVersionApiResponse, 'reviewables'> {
  reviewables?: ReviewableResponse[] // Use the updated reviewable type
}

//   Update the definitions and tag types
type Definitions = DefinitionsFromApi<typeof api>
export type TagTypes = TagTypesFromApi<typeof api>
// update the definitions to include the new types
export type UpdatedDefinitions = Omit<Definitions, 'getReviewablesForVersion'> & {
  getReviewablesForVersion: OverrideResultType<
    Definitions['getReviewablesForVersion'],
    UpdatedGetReviewablesForVersionApiResponse
  >
}
