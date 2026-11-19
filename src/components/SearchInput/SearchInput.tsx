import { forwardRef, InputHTMLAttributes } from 'react'
import { Icon, InputText } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { SearchField } from './SearchInput.styled'

// a plain text search or filter field with a search icon at the start;
// className and style size the field, the other props go to the input
export const SearchInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, style, placeholder, ...props }, ref) => (
    <SearchField className={clsx('search-input', className)} style={style}>
      <Icon icon="search" className="search-icon" />
      <InputText
        ref={ref}
        placeholder={placeholder}
        aria-label={props['aria-label'] || placeholder}
        autoComplete="off"
        {...props}
      />
    </SearchField>
  ),
)
SearchInput.displayName = 'SearchInput'

export default SearchInput
