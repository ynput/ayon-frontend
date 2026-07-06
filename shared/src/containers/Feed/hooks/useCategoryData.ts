import { useMemo } from "react"
import { useFeedContext } from "../context/FeedContext"

const FALLBACK_COLOR = '#c5c5c5'

export function useCategoryData(category?: string) {
  const { categories } = useFeedContext()

  const { categoryData, categoryNotFound } = useMemo(() => {
    let categoryNotFound = false
    if (category) {
      const foundCategory = categories.find((cat) => cat.name === category)
      if (!foundCategory) {
        categoryNotFound = true
      }
      return {
        categoryData: foundCategory || {
          name: category,
          color: FALLBACK_COLOR,
        },
        categoryNotFound,
      }
    } else {
      return {
        categoryData: null,
        categoryNotFound,
      }
    }
  }, [category, categories])

  return { categoryData, categoryNotFound }
}
