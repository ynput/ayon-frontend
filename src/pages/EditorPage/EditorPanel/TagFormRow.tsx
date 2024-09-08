import { TagsSelect } from "@ynput/ayon-react-components"
import { useSelector } from "react-redux"
import { $Any } from "@types"

type Props = {
  value: $Any
  isChanged: boolean
  isMultiple: boolean
  onChange: $Any
}

const TagFormRow = ({
  value,
  onChange,
  isChanged,
  isMultiple,
}: Props) => {
  const projectTagsOrder = useSelector((state: $Any) => state.project.tagsOrder)
  const projectTagsObject = useSelector((state: $Any) => state.project.tags)

  return (
    <TagsSelect
      value={value}
      tags={projectTagsObject}
      tagsOrder={projectTagsOrder}
      isMultiple={isMultiple}
      onChange={onChange}
      align="right"
      width={200}
      buttonStyle={{ border: '1px solid var(--md-sys-color-outline-variant)' }}
      isChanged={isChanged}
      editor
      options={[]}
    />
  )
}
export default TagFormRow