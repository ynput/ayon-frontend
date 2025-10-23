const hexToRgb = (hex: string): [number, number, number] => {
  const normalizedHex = hex.startsWith('#') ? hex.slice(1) : hex;

  if (normalizedHex.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(normalizedHex)) {
    throw new Error(`Invalid hex color format: ${hex}`);
  }

  const bigint = parseInt(normalizedHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return [r, g, b];
};

export const getTextColor = (backgroundColor?: string, threshold: number = 160): string => {
  try {
    const [r, g, b] = hexToRgb(backgroundColor || '#ffffff');

    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > threshold ? '#161616' : '#e0e0e0';

  } catch (error) { // variables for example
    return '#161616';
  }
};
