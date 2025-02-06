import { useState, useRef, useEffect, MutableRefObject } from 'react'

interface PortalElements {
  bgElement: HTMLElement | null
  logoElement: HTMLElement | null
  containerRef: MutableRefObject<HTMLDivElement | null>
}

const usePortalElements = (): PortalElements => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [bgElement, setBgElement] = useState<HTMLElement | null>(null)
  const [logoElement, setLogoElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateElements = () => {
      setBgElement(
        container.querySelector(
          '[data-schema-id="root_customization_login_background"] .form-inline-field-widget',
        ) as HTMLElement | null,
      )
      setLogoElement(
        container.querySelector(
          '[data-schema-id="root_customization_studio_logo"] .form-inline-field-widget',
        ) as HTMLElement | null,
      )
    }

    const observer = new MutationObserver(updateElements)
    observer.observe(container, { childList: true, subtree: true })

    // initial query
    updateElements()

    return () => observer.disconnect()
  }, [])

  return { bgElement, logoElement, containerRef }
}

export default usePortalElements
