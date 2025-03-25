  const callbackOnKeyDown = (e, { validationPassed, callback}) => {
    // if enter then submit
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || e.shiftKey) && validationPassed) {
      e.preventDefault()
      const closeOnSubmit = e.ctrlKey || e.metaKey
      callback(closeOnSubmit)
    }
  }
  export default callbackOnKeyDown