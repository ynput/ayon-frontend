import { css } from 'styled-components'

// Syntax colours for prism `token` classes, used by the editor and the comment renderer
// (One Light / One Dark, following the theme)
export const codeTokenStyles = css`
  .token.comment,
  .token.prolog,
  .token.doctype,
  .token.cdata {
    color: light-dark(#a0a1a7, #7f848e);
    font-style: italic;
  }
  .token.punctuation {
    color: light-dark(#383a42, #abb2bf);
  }
  .token.property,
  .token.tag,
  .token.symbol,
  .token.deleted,
  .token.variable {
    color: light-dark(#e45649, #e06c75);
  }
  .token.boolean,
  .token.number,
  .token.constant,
  .token.attr-name {
    color: light-dark(#986801, #d19a66);
  }
  .token.string,
  .token.char,
  .token.attr-value,
  .token.inserted {
    color: light-dark(#50a14f, #98c379);
  }
  .token.selector,
  .token.keyword,
  .token.atrule,
  .token.important {
    color: light-dark(#a626a4, #c678dd);
  }
  .token.function {
    color: light-dark(#4078f2, #61afef);
  }
  .token.class-name,
  .token.namespace {
    color: light-dark(#c18401, #e5c07b);
  }
  .token.operator,
  .token.entity,
  .token.url,
  .token.regex,
  .token.builtin {
    color: light-dark(#0184bc, #56b6c2);
  }
`
