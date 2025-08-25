import { useEffect, useRef } from 'react'

export const useDropdownStyling = () => {
  const dropdownRef = useRef<any>(null)

  useEffect(() => {

    const applyDropdownStyles = () => {
      const containers = document.querySelectorAll('div[class*="container"]')
      containers.forEach((container) => {
        const style = window.getComputedStyle(container)
        if (style.position === 'fixed') {
          const hasOurOptions = container.querySelector(
            'ul[class*="options"] li[data-value="picture-in-picture"]',
          )

          const dropdownButton = dropdownRef.current?.getElement()
          const containerRect = container.getBoundingClientRect()
          const buttonRect = dropdownButton?.getBoundingClientRect()

          const isNearButton =
            buttonRect &&
            Math.abs(containerRect.left - buttonRect.left) < 50 &&
            Math.abs(containerRect.top - buttonRect.top) < 100

          if (hasOurOptions || isNearButton) {
            const containerElement = container as HTMLElement
            containerElement.setAttribute(
              'style',
              `
              position: fixed !important;
              right: 0 !important;
              left: auto !important;
              top: ${containerElement.style.top || '140px'} !important;
              ${containerElement.style.cssText}
            `,
            )

            const optionsList = container.querySelector('ul[class*="options"]') as HTMLElement
            if (optionsList) {
              optionsList.setAttribute(
                'style',
                `
                width: 200px !important;
                min-width: 200px !important;
                max-width: 200px !important;
                ${optionsList.style.cssText}
              `,
              )
            }
          }
        }
      })
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element
              if (element.classList && element.classList.contains('container')) {
                setTimeout(applyDropdownStyles, 0)
              }
            }
          })
        }
      })
    })

    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
    }
  }, [])

  return dropdownRef
}
