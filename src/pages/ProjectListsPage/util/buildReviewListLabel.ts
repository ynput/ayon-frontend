const buildReviewListLabel = (
  label: string,
  existingLabels: string[],
  maxAttempts = 100,
): string => {
  if (typeof label !== 'string' || !Array.isArray(existingLabels)) {
    return `${label} (review)`
  }

  const baseLabel = `${label.trim()} (review)`

  // Check if base label already exists
  if (!existingLabels.includes(baseLabel)) {
    return baseLabel
  }

  // If base label exists, try with counter starting from 1
  let counter = 2
  let uniqueLabel = `${label.trim()} (review ${counter})`
  while (existingLabels.includes(uniqueLabel) && counter < maxAttempts) {
    counter += 1
    uniqueLabel = `${label.trim()} (review ${counter})`
  }

  return uniqueLabel
}

export default buildReviewListLabel
