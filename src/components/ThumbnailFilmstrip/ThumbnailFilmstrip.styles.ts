import styled from 'styled-components';

export const ThumbnailFilmstripContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  background: #1a1a2e;
  padding: 8px 0;
  border-radius: 4px;
  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-track {
    background: #2d2d44;
  }
  &::-webkit-scrollbar-thumb {
    background: #555;
    border-radius: 3px;
  }
`;

export const FilmstripTrack = styled.div`
  display: flex;
  gap: 4px;
  padding: 0 8px;
  cursor: pointer;
  > div {
    flex: 0 0 auto;
    transition: transform 0.2s;
    &:hover {
      transform: scale(1.05);
    }
  }
`;

export const ThumbnailImage = styled.img`
  height: 80px;
  width: auto;
  border-radius: 2px;
  display: block;
`;

export const ThumbnailTime = styled.span`
  display: block;
  text-align: center;
  font-size: 12px;
  color: #ccc;
  margin-top: 2px;
`;
