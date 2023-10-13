import styled from 'styled-components'

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  position: absolute;

  inset: 0;

  .no-products {
    height: 300px;
    width: 150px;

    .skeleton {
      width: 150px;
      height: 150px;
    }

    & > span {
      top: 40px;
      text-align: center;
      width: 100%;
      position: relative;
      display: block;

      font-size: var(--md-sys-typescale-headline-medium-font-size);
      user-select: none;
    }
  }

  button {
    margin-top: 40px;
    padding: 16px 16px;
    font-size: var(--md-sys-typescale-title-medium-font-size);
    z-index: 20;
    border-radius: var(--border-radius-xxl);
  }
`
