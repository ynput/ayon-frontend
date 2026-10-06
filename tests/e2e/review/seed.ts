import { AyonApi, Reviewable, Version } from '../support/api'
import { Media } from '../media'

export type SeededVersion = Version & { name: string; reviewables: Reviewable[] }

export const seedReviewVersions = async (
  api: AyonApi,
  projectName: string,
  versions: { media: Media; label?: string }[][],
) => {
  const shot = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  const product = await api.createProduct(projectName, { folderId: shot.id, name: 'renderMain' })
  const seeded: SeededVersion[] = []
  for (const [index, uploads] of versions.entries()) {
    const version = await api.createVersion(projectName, {
      productId: product.id,
      version: index + 1,
    })
    const reviewables: Reviewable[] = []
    for (const { media, label } of uploads) {
      reviewables.push(await api.uploadReviewable(projectName, version.id, media.path, { label }))
    }
    seeded.push({ ...version, name: `v${String(index + 1).padStart(3, '0')}`, reviewables })
  }
  return { shot, product, versions: seeded }
}
