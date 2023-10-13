const getMentionOptions = (type, values = {}, search) => {
  // values  = { users: function, tags: function }

  if (!(type in values)) return []

  const allOptions = values[type]() || []

  if (!search) return allOptions

  const filteredOptions = allOptions.filter(
    (op) =>
      !search || op.keywords.some((n) => n?.replace(/\s/g, '').toLowerCase().includes(search)),
  )

  filteredOptions.sort((a, b) => a.label.localeCompare(b.label))

  return filteredOptions
}

export default getMentionOptions
