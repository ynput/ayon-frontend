import { HTMLAttributes, ReactNode, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Filmstrip } from './Filmstrip'

interface UseEntityCardFilmstripResult {
  /** pass to EntityCard `pt.thumbnail` */
  thumbnailProps: Partial<HTMLAttributes<HTMLDivElement>>
  /** render next to the EntityCard */
  filmstrip: ReactNode
}

/**
 * Adds a hover-scrub filmstrip to an ARC EntityCard.
 *
 * EntityCard does not accept thumbnail children, but it spreads `pt.thumbnail` onto its
 * thumbnail element (ref included), so the filmstrip is portalled into that element.
 *
 * @example
 * const { thumbnailProps, filmstrip } = useEntityCardFilmstrip(filmstripUrl)
 * <EntityCard pt={{ thumbnail: thumbnailProps }} />
 * {filmstrip}
 */
export const useEntityCardFilmstrip = (
  src?: string | null,
  { disabled }: { disabled?: boolean } = {},
): UseEntityCardFilmstripResult => {
  const [thumbnail, setThumbnail] = useState<HTMLDivElement | null>(null)

  const thumbnailProps = useMemo(
    () => ({ ref: setThumbnail } as Partial<HTMLAttributes<HTMLDivElement>>),
    [],
  )

  const filmstrip =
    src && thumbnail
      ? createPortal(<Filmstrip src={src} fit="cover" disabled={disabled} />, thumbnail)
      : null

  return { thumbnailProps, filmstrip }
}
