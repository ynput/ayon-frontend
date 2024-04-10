import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as Styled from './CommentInput.styled'
import { Button, SaveButton } from '@ynput/ayon-react-components'
import 'react-quill/dist/quill.bubble.css'
import TurndownService from 'turndown'
import ReactMarkdown from 'react-markdown'
import ReactQuill from 'react-quill'
import { toast } from 'react-toastify'
import CommentMentionSelect from '../CommentMentionSelect/CommentMentionSelect'
import getMentionOptions from '/src/containers/Feed/mentionHelpers/getMentionOptions'
import getMentionUsers from '/src/containers/Feed/mentionHelpers/getMentionUsers'
import { useGetMentionTasksQuery } from '/src/services/userDashboard/getUserDashboard'
import getMentionTasks from '/src/containers/Feed/mentionHelpers/getMentionTasks'
import getMentionVersions from '/src/containers/Feed/mentionHelpers/getMentionVersions'

const CommentInput = ({
  initValue,
  onSubmit,
  isOpen,
  setIsOpen,
  activeUsers,
  selectedTasksProjects,
  userName,
  versions = [],
}) => {
  const [initHeight, setInitHeight] = useState(88)
  const [editorValue, setEditorValue] = useState('')

  // MENTION STATES
  const [mention, setMention] = useState(null)
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(null)
  // REFS
  const editorRef = useRef(null)
  const markdownRef = useRef(null)

  // Set initial value
  useEffect(() => {
    if (markdownRef.current && initValue) {
      // convert markdown to html
      const html = markdownRef.current.innerHTML
      setEditorValue(html)
      // set html to editor
      // get height of markdown
      const height = markdownRef.current.offsetHeight
      setInitHeight(height)
    }
  }, [initValue, markdownRef.current])

  const { data: mentionTasks } = useGetMentionTasksQuery(
    { projectName: selectedTasksProjects[0], assignee: userName },
    {
      skip: selectedTasksProjects?.length !== 1,
    },
  )

  // CONFIG
  const placeholder = `Comment or tag with @user, @@version, @@@task...`

  var turndownService = new TurndownService()

  const mentionTypes = ['@', '@@', '@@@']
  const typeOptions = {
    '@@@': {
      id: 'task',
    },
    '@@': {
      id: 'version',
    },
    '@': {
      id: 'user',
      isCircle: true,
    },
  }
  mentionTypes.sort((a, b) => b.length - a.length)

  const mentionOptions = useMemo(
    () =>
      getMentionOptions(
        mention?.type,
        {
          '@': () => getMentionUsers(activeUsers),
          '@@': () => getMentionVersions(versions),
          '@@@': () => getMentionTasks(mentionTasks),
        },
        mention?.search,
      ),
    [activeUsers, mention?.type, mention?.search],
  )

  // show first 5
  const shownMentionOptions = mentionOptions.slice(0, 5)

  // triggered when a mention is selected
  const [newSelection, setNewSelection] = useState()

  useEffect(() => {
    if (newSelection) {
      setNewSelection(null)
      // now we set selection to the end of the mention
      const quill = editorRef.current.getEditor()
      quill.setSelection(newSelection)
    }
  }, [newSelection])

  const findStartAndEndIndexes = (string) => {
    const start = editorValue.indexOf(string)
    if (start === -1) return []
    const end = start + string.length
    return { start, end }
  }

  const handleSelectMention = (selectedOption, retain) => {
    // get option text
    const quill = editorRef.current.getEditor()
    // insert space instead of tab or enter
    const replace = mention.type + (mention.search || '')
    const mentionText = mention.type + selectedOption.label
    const type = typeOptions[mention.type]
    const href = `${type?.id}:${selectedOption.id}`

    // find all previous mentions (a tags) in the editor
    const previousMentions = quill.getContents().ops.filter((op) => op.attributes?.link)

    // find the start and end index of all the found mentions
    const previousMentionsIndexes = previousMentions.reduce((acc, op) => {
      const indexes = []
      if (op.attributes?.link) {
        indexes.push(findStartAndEndIndexes(op.attributes.link))
      }
      if (op.insert) {
        indexes.push(findStartAndEndIndexes(op.insert))
      }
      acc.push(...indexes)
      return acc
    }, [])

    // find all indexes of replace in the editor
    var replaceIndexes = []
    for (var i = 0; i < editorValue.length; i++) {
      if (editorValue.substring(i, i + replace.length) === replace) {
        // check that the i is not between the start and end indexes of a found mentions
        const isBetween = previousMentionsIndexes.some((index) => i >= index.start && i < index.end)
        if (!isBetween) {
          replaceIndexes.push(i)
        }
      }
    }

    if (replaceIndexes.length === 0) {
      return toast.error('Could not find mention in editor. Please try again.')
    }

    const replaceStartIndex = replaceIndexes[0]
    const replaceEndIndex = replaceStartIndex + replace.length

    // remove the original search mention by deleting the text from start to finish
    const editorValueWithoutMention =
      editorValue.slice(0, replaceStartIndex) + editorValue.slice(replaceEndIndex)

    const newString = `<a href="@${href}">${mentionText}</a>&nbsp;`

    // now add the new mention in at the same index
    const editorValueWithNewMention =
      editorValueWithoutMention.slice(0, replaceStartIndex) +
      newString +
      editorValueWithoutMention.slice(replaceStartIndex)

    const deltaContent = quill.clipboard.convert(editorValueWithNewMention)

    quill.setContents(deltaContent, 'silent')

    const newSelection = retain + (selectedOption.label.length - (mention.search?.length || 0)) + 1
    setNewSelection(newSelection)
    setMention(null)
    setMentionSelectedIndex(0)
  }

  const handleSelectChange = (option) => {
    // get current selection position
    const quill = editorRef.current.getEditor()
    const selection = quill.getSelection()

    handleSelectMention(option, selection.index)
  }

  const handleChange = (content, delta, _, editor) => {
    let currentCharacter =
      (delta.ops[0] && delta.ops[0].insert) || (delta.ops[1] && delta.ops[1].insert)

    const tabOrEnter = currentCharacter === '\n' || currentCharacter === '\t'
    // find the first option
    const selectedOption = mentionOptions[mentionSelectedIndex]

    if (mention && tabOrEnter && selectedOption) {
      // get option text
      const retain = (delta.ops[0] && delta.ops[0].retain) || 0

      return handleSelectMention(selectedOption, retain)
    }

    setEditorValue(content)

    const isDelete = delta.ops.length === 2 && delta.ops[1].delete

    if (!currentCharacter && isDelete) {
      currentCharacter = editor.getText(delta.ops[0].retain - 1, 1)
    }

    const isMention = mentionTypes.includes(currentCharacter)

    if (isMention) {
      const mentionIndex = delta.ops.findIndex((op) => 'insert' in op || 'delete' in op)
      const mention = currentCharacter
      let retain = mentionIndex === 0 ? 0 : delta.ops[mentionIndex - 1].retain
      if (isDelete) retain = retain - 1

      // for each mention denotation char, check if it is a mention
      // sort by length of mention denotation char
      let mentionMatch = null

      // loop through each mention denotation char, with longest first. First one to match is the one we want
      for (const chars of mentionTypes) {
        let isMatch = true
        // start with the last character
        if (chars.endsWith(mention)) {
          // loop through the chars backwards
          for (let i = chars.length - 1; i >= 0; i--) {
            // skip first character as that's already been checked
            if (i === 0) continue
            const char = chars[i - 1]
            const indexInDelta = retain - (chars.length - i)
            const valueCharAtIndex = editor.getText(indexInDelta, 1)
            if (valueCharAtIndex !== char) {
              isMatch = false
              break
            }
          }
        } else {
          isMatch = false
        }

        if (isMatch) {
          // console.log('match!!!', chars)
          mentionMatch = chars
          break
        }
      }

      if (mentionMatch) {
        setMention({
          type: mentionMatch,
          retain: retain,
        })
      } else {
        setMention(null)
        setMentionSelectedIndex(0)
      }
    } else {
      // get full string between mention and new delta
      // This is where SEARCH is handled
      if (mention) {
        const retain = delta.ops[0].retain
        // if space is pressed, remove mention
        if (currentCharacter === ' ' || !retain) {
          setMention(null)
          setMentionSelectedIndex(0)
          return
        }

        let distanceMentionToRetain = retain - mention.retain
        if (!isDelete) distanceMentionToRetain++
        const mentionFull = editor.getText(mention.retain, distanceMentionToRetain)
        const mentionSearch = mentionFull.replace(mention.type.slice(-1), '')
        //  check for space in mentionFull
        if (mentionFull.includes(' ')) {
          setMention(null)
          setMentionSelectedIndex(0)
        } else {
          setMention({
            ...mention,
            search: mentionSearch?.toLowerCase(),
          })
        }
      }
    }
  }

  const handleToolbarMention = (type) => {
    // get editor retain
    const quill = editorRef.current.getEditor()

    let retain = quill.getSelection()?.index || 0

    // get character at retain
    const currentCharacter = quill.getText(retain - 1, 1)

    // if the current character is a character, increment retain
    const addSpace = currentCharacter !== ' ' && currentCharacter
    if (addSpace) {
      quill.insertText(retain, ' ')
      retain++
    }

    for (const string of type) {
      quill.insertText(retain, string)
    }
  }

  const convertToMarkdown = () => {
    // convert to markdown
    let markdown = turndownService.turndown(editorValue)

    let body = markdown

    // inside the markdown, find characters inside () or [] and replace @ with nothing
    const regex = /\((.*?)\)|\[(.*?)\]/g
    const matches = markdown.match(regex)
    if (matches) {
      matches.forEach((match) => {
        console.log('match', match)
        const newMatch = match.replaceAll('@', '')
        body = body.replace(match, newMatch)
      })
    }

    return body
  }

  const handleSubmit = () => {
    try {
      // convert to markdown
      const markdown = convertToMarkdown()

      if (markdown && onSubmit) {
        onSubmit(markdown)
        setEditorValue('')
      }
    } catch (error) {
      console.error(error)
      toast.error('Something went wrong')
    }
  }

  const handleOpenClick = () => {
    if (isOpen) return

    setIsOpen(true)
    editorRef.current.getEditor().enable()
    editorRef.current.focus()
  }

  const handleKeyDown = (e) => {
    if (mention) {
      // close mention on escape
      if (e.key === 'Escape') {
        setMention(null)
        setMentionSelectedIndex(0)
        return
      }

      // add top search of mention
      if (mention && e.key === 'Tab') {
        // we handle this in the onChange
      }

      const arrowDirection = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0

      if (arrowDirection) {
        // navigate through mentions
        e.preventDefault()
        let newIndex = mentionSelectedIndex + arrowDirection
        if (newIndex < 0) newIndex = shownMentionOptions.length - 1
        if (newIndex >= shownMentionOptions.length) newIndex = 0
        setMentionSelectedIndex(newIndex)
      }

      if (e.key === 'Enter') {
        // we handle this in the onChange
      }
    }

    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit()
    }
  }

  return (
    <>
      <Styled.AutoHeight
        style={{
          translate: isOpen ? '0' : '0 50px',
          marginTop: isOpen ? '0' : '-50px',
        }}
      >
        <Styled.Comment
          $isOpen={isOpen}
          className="block-shortcuts"
          onKeyDown={handleKeyDown}
          onClick={handleOpenClick}
        >
          <Styled.Markdown ref={markdownRef}>
            {/* this is purely used to translate the markdown into html for Editor */}
            <ReactMarkdown>{initValue}</ReactMarkdown>
          </Styled.Markdown>
          <ReactQuill
            theme="bubble"
            style={{ minHeight: isOpen ? initHeight : 44, maxHeight: 300 }}
            ref={editorRef}
            value={editorValue}
            onChange={handleChange}
            readOnly={!isOpen}
            placeholder={placeholder}
          />

          <Styled.Footer>
            <Styled.Commands>
              {/* mention a user */}
              <Button icon="alternate_email" onClick={() => handleToolbarMention('@')} />
              {/* mention a version */}
              <Button icon="layers" onClick={() => handleToolbarMention('@@')} />
              {/* mention a task */}
              <Button icon="check_circle" onClick={() => handleToolbarMention('@@@')} />
            </Styled.Commands>
            <SaveButton
              label="Comment"
              className="comment"
              active={!!editorValue}
              onClick={handleSubmit}
            />
          </Styled.Footer>
        </Styled.Comment>
        <CommentMentionSelect
          mention={mention}
          options={shownMentionOptions}
          onChange={handleSelectChange}
          types={mentionTypes}
          config={typeOptions[mention?.type]}
          noneFound={!shownMentionOptions.length && mention?.search}
          noneFoundAtAll={!shownMentionOptions.length && !mention?.search}
          selectedIndex={mentionSelectedIndex}
        />
      </Styled.AutoHeight>
    </>
  )
}

export default CommentInput
