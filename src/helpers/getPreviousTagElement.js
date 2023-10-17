function getPreviousTagElement(element, tag) {
  let previousElement = element.previousElementSibling

  while (previousElement && tag) {
    if (previousElement.tagName === tag) {
      return previousElement
    }
    previousElement = previousElement.previousElementSibling
  }

  return null
}

export default getPreviousTagElement
