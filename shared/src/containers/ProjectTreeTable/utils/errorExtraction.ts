/**
 * Extracts error message from a GraphQL/API error response
 */
export const extractErrorMessage = (error: any): string | undefined => {
  return error?.data?.detail
}
