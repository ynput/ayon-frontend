import { css } from 'styled-components'

// Syntax colours for prism `token` classes, used by the editor and the comment renderer
export const codeTokenStyles = css`
  .token.comment,
  .token.prolog,
  .token.doctype,
  .token.cdata {
    color: #7f848e;
    font-style: italic;
  }
  .token.punctuation {
    color: #abb2bf;
  }
  .token.property,
  .token.tag,
  .token.symbol,
  .token.deleted,
  .token.variable {
    color: #e06c75;
  }
  .token.boolean,
  .token.number,
  .token.constant,
  .token.attr-name {
    color: #d19a66;
  }
  .token.string,
  .token.char,
  .token.attr-value,
  .token.inserted {
    color: #98c379;
  }
  .token.selector,
  .token.keyword,
  .token.atrule,
  .token.important {
    color: #c678dd;
  }
  .token.function {
    color: #61afef;
  }
  .token.class-name,
  .token.namespace {
    color: #e5c07b;
  }
  .token.operator,
  .token.entity,
  .token.url,
  .token.regex,
  .token.builtin {
    color: #56b6c2;
  }
`
