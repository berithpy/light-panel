export interface Color {
  r: number
  g: number
  b: number
}

export const PRESET_COLORS = [
  { name: 'Red', color: { r: 255, g: 0, b: 0 } },
  { name: 'Green', color: { r: 0, g: 255, b: 0 } },
  { name: 'Blue', color: { r: 0, g: 0, b: 255 } },
  { name: 'Yellow', color: { r: 255, g: 255, b: 0 } },
  { name: 'Cyan', color: { r: 0, g: 255, b: 255 } },
  { name: 'Magenta', color: { r: 255, g: 0, b: 255 } },
  { name: 'White', color: { r: 255, g: 255, b: 255 } },
  { name: 'Orange', color: { r: 255, g: 165, b: 0 } },
  { name: 'Purple', color: { r: 128, g: 0, b: 128 } },
  { name: 'Pink', color: { r: 255, g: 192, b: 203 } },
]

// Normalize RGB values from 0-255 to 0-1 for Display P3
// so that we show hdr colors on supported devices
export const rgbToP3 = (color: Color): string => {
  const r = color.r / 255
  const g = color.g / 255
  const b = color.b / 255
  return `color(display-p3 ${r} ${g} ${b})`
}
