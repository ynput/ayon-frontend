export const PREVIEW_VERSIONS_QUERY = `
query getPreviewAllVersions($projectName: String!, $productIds: [String!]) {
  project(name: $projectName) {
    versions(productIds: $productIds) {
      edges {
        node {
          id
          name
          version
          productId
          status
        }
      }
    }
  }
}
`
