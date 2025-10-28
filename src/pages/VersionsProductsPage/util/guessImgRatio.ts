import { ColumnsConfig } from '@shared/containers'

const DEFAULT_RATIO = 1.77777778 // default to 16:9

// try to guess the image ratio from the row height and thumbnail column width
export const guessImgRatio = (rowHeight: number, columns: ColumnsConfig): number => {
  const thumbnailColumn = columns.columnSizing['thumbnail']
  if (thumbnailColumn && rowHeight) {
    return thumbnailColumn / rowHeight
  } else return DEFAULT_RATIO
}
