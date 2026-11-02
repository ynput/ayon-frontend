import React from 'react'
import { BorderedSection } from '@ynput/ayon-react-components'
import { MarkdownEditor, DESCRIPTION_TOOLBAR } from '@shared/components/MarkdownEditor'
import { StyledEditor } from '@shared/components/DetailsPanelDetails/DescriptionSection.styles'

type BundleDescriptionFieldProps = {
  value?: string | null
  onChange: (value: string) => void
}

const BundleDescriptionField: React.FC<BundleDescriptionFieldProps> = ({ value, onChange }) => (
  <BorderedSection title="Description" autoHeight showHeader>
    <StyledEditor className="block-shortcuts">
      <MarkdownEditor
        value={value || ''}
        onChange={onChange}
        placeholder="Describe it, or type / to add headings, lists, code and more..."
        toolbar={DESCRIPTION_TOOLBAR}
        bordered={false}
        minHeight={60}
        maxHeight={400}
      />
    </StyledEditor>
  </BorderedSection>
)

export default BundleDescriptionField
