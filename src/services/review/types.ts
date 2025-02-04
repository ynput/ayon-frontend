export type Summary = {
  activityId?: string
  sourceFileId?: string
  targetFileId?: string
  versionId?: string
}

import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
import {
  api,
  ReviewableModel,
  ReviewableProcessingStatus,
  GetReviewablesForVersionApiResponse,
  VersionReviewablesModel,
} from '@api/rest/review'

// UPDATE GetReviewablesForVersionApiResponse to include the new processing type
// Define a type alias for Processing to extend it correctly
interface Processing extends ReviewableProcessingStatus {
  progress?: number
}

// Extend UpdatedReviewable with the new Processing type
export interface ReviewableResponse extends Omit<ReviewableModel, 'processing'> {
  processing: Processing // Use the new Processing type here
  mediaInfo?: {
    codec?: string
    duration?: number
    frameRate?: number
    height?: number
    iframeOnly?: boolean
    majorBrand?: string
    pixelFormat?: string
    probeVersion?: number
    videoTrackIndex?: number
    width?: number
  }
}

// Extend the main response interface
export interface GetReviewablesResponse extends Omit<VersionReviewablesModel, 'reviewables'> {
  reviewables?: ReviewableResponse[] // Use the updated reviewable type
}

type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U]

export type GetViewerReviewablesParams = AtLeastOne<{
  productId: string
  taskId: string
  folderId: string
}> & {
  projectName: string
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
