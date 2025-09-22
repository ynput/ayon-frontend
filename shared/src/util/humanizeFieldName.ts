export function humanizeField(input: string): string {
    if (!input) return ''
    
    // Handle special cases - common acronyms that should stay uppercase
    const acronyms = ['FPS', 'ID', 'API', 'URL', 'HTML', 'CSS', 'JS', 'XML', 'JSON']

    // Normalize common separators to spaces
    const normalized = input.replace(/[_\-.]+/g, ' ').trim()

    const tokenRegex = /[A-Z]+(?=[A-Z][a-z])|[A-Z]?[a-z]+|[A-Z]+|\d+/g

    const words: string[] = normalized
      .split(/\s+/)
      .flatMap(part => part.match(tokenRegex) ?? [part])

    return words
      .map((word, index) => {
        const upper = word.toUpperCase()
        // Keep acronyms (known or any all-caps token longer than 1 char)
        if (acronyms.includes(upper) || (word.length > 1 && word === upper)) {
          return upper
        }
        return index === 0 ? capitalize(word.toLowerCase()) : word.toLowerCase()
      })
      .join(' ')
  }
  
  function capitalize(value: string): string {
    if (!value) return value
    return value.charAt(0).toUpperCase() + value.slice(1)
  }