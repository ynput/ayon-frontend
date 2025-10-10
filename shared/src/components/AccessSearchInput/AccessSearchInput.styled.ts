import styled from "styled-components";

export const Container = styled.div`
  position: relative;
  width: 100%;

  input {
    min-height: 32px;
    max-height: 32px;
  }
`;

export const SuggestionsList = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--md-sys-color-surface-container-low);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-top: none;
  border-radius: 0 0 var(--border-radius-m) var(--border-radius-m);
  overflow-y: auto;
  z-index: 1000;
  list-style: none;
  margin: 0;
  padding: var(--padding-s);
  max-height: 150px;

  &.no-owner {
    max-height: 118px;
  }

  /* Add highlighting styles for AccessUser components */
  .highlighted {
    background-color: var(--md-sys-color-surface-container-high-hover);
    border-radius: var(--border-radius-m);
  }

  .tip {
    color: var(--md-sys-color-outline);
  }
`;
