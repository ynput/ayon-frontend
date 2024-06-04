export const PREVIEW_QUERY = `
query getPreview($projectName: String!, $versionIds: [String!]) {
    project(name: $projectName) {
      versions(ids: $versionIds) {
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
