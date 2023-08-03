import { useEffect } from 'react'

const useScrollSync = (refs = [], deps = []) => {
  //   when one table scrolls it should scroll the others
  useEffect(() => {
    const handleScroll = (event) => {
      const { target } = event
      const { scrollTop } = target
      refs.current.forEach((addonListRef) => {
        const scrollerRef = addonListRef?.getElement()?.querySelector('.p-datatable-wrapper')
        if (scrollerRef !== target) {
          scrollerRef.scrollTop = scrollTop
        }
      })
    }

    refs.current.forEach((addonListRef) => {
      const scrollerRef = addonListRef?.getElement()?.querySelector('.p-datatable-wrapper')
      if (scrollerRef) {
        scrollerRef.addEventListener('scroll', handleScroll)
      }
    })

    return () => {
      refs.current.forEach((addonListRef) => {
        const scrollerRef = addonListRef?.getElement()?.querySelector('.p-datatable-wrapper')
        if (scrollerRef) {
          scrollerRef.removeEventListener('scroll', handleScroll)
        }
      })
    }
  }, [refs, ...deps])
}

export default useScrollSync
