import styled from 'styled-components'

/**
 * Shared styles for React Quill list elements to fix unordered list showing as ordered list
 * This component provides consistent list styling across different Quill editors
 */
export const QuillListStyles = styled.div`
  height: 100%;
  /* Fix for unordered list showing as ordered list */
  .ql-editor ol,
  .ql-editor ul {
    margin: 16px 0 !important;
    padding-left: 20px;

    li {
      padding-left: 0;

      /* Hide React Quill's ::before pseudo-elements */
      &::before {
        content: none;
      }

      &[data-list='ordered'] {
        list-style-type: decimal;
        list-style-position: inside;
      }

      &[data-list='bullet'] {
        list-style-type: circle;
        list-style-position: inside;
      }

      /* checkbox data-checked false or true */
      &[data-list='unchecked'],
      &[data-list='checked'] {
        margin-left: 8px;
        min-height: 25px;

        &::before {
          font-size: unset;
          top: 7px;
          position: relative;
        }

        .ql-ui {
          /* tick circle */
          margin-right: 8px;
        }
      }

      &[data-list='checked'] {
        &::before {
          /* tick circle svg */
          content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 -960 960 960' width='24' fill='%2323E0A9'%3E%3Cpath d='m427.462-343.692 233.846-232.846L620-617.846 427.462-426.308l-87-86L299.154-471l128.308 127.308ZM480.134-104q-77.313 0-145.89-29.359-68.577-29.36-120.025-80.762-51.447-51.402-80.833-119.917Q104-402.554 104-479.866q0-78.569 29.418-146.871 29.419-68.303 80.922-119.917 51.503-51.614 119.916-80.48Q402.67-856 479.866-856q78.559 0 146.853 28.839 68.294 28.84 119.922 80.422 51.627 51.582 80.493 119.841Q856-558.639 856-480.05q0 77.589-28.839 145.826-28.84 68.237-80.408 119.786-51.569 51.548-119.81 80.993Q558.702-104 480.134-104Z'/%3E%3C/svg%3E");
        }
      }
      &[data-list='unchecked'] {
        &::before {
          /* open circle svg */
          content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 -960 960 960' width='24' fill='%23F4F5F5'%3E%3Cpath d='M480.409-104q-77.588 0-146.165-29.359-68.577-29.36-120.025-80.762-51.447-51.402-80.833-119.876Q104-402.471 104-480.325q0-78.11 29.418-146.412 29.419-68.303 80.922-119.917 51.503-51.614 119.875-80.48Q402.587-856 480.325-856q78.1 0 146.394 28.839 68.294 28.84 119.922 80.422 51.627 51.582 80.493 120.065Q856-558.191 856-480.326q0 77.865-28.839 146.102-28.84 68.237-80.408 119.786-51.569 51.548-120.034 80.993Q558.253-104 480.409-104ZM480-162q132.513 0 225.256-92.744Q798-347.487 798-480t-92.744-225.256Q612.513-798 480-798t-225.256 92.744Q162-612.513 162-480t92.744 225.256Q347.487-162 480-162Zm0-318Z'/%3E%3C/svg%3E");
        }
      }
    }
  }
`
