import { useState, useEffect } from 'react'
import { useLocalStorage } from '@uidotdev/usehooks'
import './App.css'
import { ColorButton } from './ColorButton'

interface Color {
  r: number
  g: number
  b: number
}

const PRESET_COLORS = [
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

function App() {
  const [color, setColor] = useState<Color>({ r: 255, g: 255, b: 255 })
  const [brightness, setBrightness] = useState(100)
  const [blinkSpeed, setBlinkSpeed] = useState(0) // 0 means no blink
  const [showControls, setShowControls] = useState(true)
  const [isVisible, setIsVisible] = useState(true)
  const [customColors, setCustomColors] = useLocalStorage<(Color | null)[]>('light-panel-custom-colors', [null, null, null, null])
  useEffect(() => {
    if (blinkSpeed === 0) {
      setIsVisible(true)
      return
    }

    const interval = setInterval(() => {
      setIsVisible(prev => !prev)
    }, blinkSpeed)

    return () => clearInterval(interval)
  }, [blinkSpeed])

  // Hide controls after 3 seconds of inactivity
  useEffect(() => {
    let timeout: number

    const resetTimer = () => {
      setShowControls(true)
      clearTimeout(timeout)
      timeout = window.setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }

    const handleClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement

      // If clicking outside controls, hide them
      if (showControls && !target.closest('.controls')) {
        setShowControls(false)
        clearTimeout(timeout)
      } else {
        // Otherwise, show controls and reset timer
        resetTimer()
      }
    }

    window.addEventListener('touchstart', handleClick)
    window.addEventListener('mousedown', handleClick)

    return () => {
      clearTimeout(timeout)
      window.removeEventListener('touchstart', handleClick)
      window.removeEventListener('mousedown', handleClick)
    }
  }, [showControls])

  const applyBrightness = (color: Color, brightness: number): Color => {
    const factor = brightness / 100
    return {
      r: Math.round(color.r * factor),
      g: Math.round(color.g * factor),
      b: Math.round(color.b * factor),
    }
  }

  const adjustedColor = applyBrightness(color, brightness)
  const backgroundColor = isVisible
    ? `rgb(${adjustedColor.r}, ${adjustedColor.g}, ${adjustedColor.b})`
    : 'rgb(0, 0, 0)'

  const rgbToHex = (color: Color): string => {
    const toHex = (n: number) => n.toString(16).padStart(2, '0')
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`
  }

  const hexToRgb = (hex: string): Color => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
      : { r: 0, g: 0, b: 0 }
  }

  return (
    <div className="app" style={{ backgroundColor }}>
      <div className={`controls controls-left ${showControls ? 'visible' : 'hidden'}`}>
        <div className="controls-content">
          <h2>Light Panel</h2>

          <div className="section">
            <h3>Preset Colors</h3>
            <div className="preset-grid">
              {PRESET_COLORS.map((preset) => (
                <ColorButton
                  key={preset.name}
                  color={preset.color}
                  name={preset.name}
                  onClick={() => setColor(preset.color)}
                />
              ))}
            </div>
          </div>

          <div className="section">
            <h3>Custom Colors</h3>
            <div className="custom-colors-grid">
              {customColors.map((customColor, index) => (
                <ColorButton
                  key={index}
                  color={customColor || { r: 50, g: 50, b: 50 }}
                  name={customColor ? `Slot ${index + 1}` : `Hold to Save Slot ${index + 1}`}
                  onClick={() => {
                    if (customColor) {
                      setColor(customColor)
                    }
                  }}
                  onLongPress={(newColor) => {
                    const newColors = [...customColors]
                    newColors[index] = newColor
                    setCustomColors(newColors)
                  }}
                  longPressColor={color}
                />
              ))}
            </div>
          </div>

          <div className="section">
            <h3>Color Picker</h3>
            <input
              type="color"
              value={rgbToHex(color)}
              onChange={(e) => setColor(hexToRgb(e.target.value))}
              className="color-picker"
            />
          </div>

          <div className="section">
            <h3>RGB Sliders</h3>
            <div className="slider-group">
              <label>
                Red: {color.r}
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={color.r}
                  onChange={(e) => setColor({ ...color, r: parseInt(e.target.value) })}
                  className="slider red"
                />
              </label>
              <label>
                Green: {color.g}
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={color.g}
                  onChange={(e) => setColor({ ...color, g: parseInt(e.target.value) })}
                  className="slider green"
                />
              </label>
              <label>
                Blue: {color.b}
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={color.b}
                  onChange={(e) => setColor({ ...color, b: parseInt(e.target.value) })}
                  className="slider blue"
                />
              </label>
            </div>
          </div>

          <div className="section">
            <button
              className="fullscreen-button"
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen()
                } else {
                  document.exitFullscreen()
                }
              }}
            >
              Toggle Fullscreen
            </button>
          </div>
        </div>
      </div>

      <div className={`controls controls-right ${showControls ? 'visible' : 'hidden'}`}>
        <div className="controls-content">
          <h2>Settings</h2>

          <div className="section">
            <h3>Brightness: {brightness}%</h3>
            <input
              type="range"
              min="0"
              max="100"
              value={brightness}
              onChange={(e) => setBrightness(parseInt(e.target.value))}
              className="slider brightness"
            />
          </div>

          <div className="section">
            <h3>Blink Speed: {blinkSpeed === 0 ? 'Off' : `${blinkSpeed}ms`}</h3>
            <input
              type="range"
              min="0"
              max="1000"
              step="50"
              value={blinkSpeed}
              onChange={(e) => setBlinkSpeed(parseInt(e.target.value))}
              className="slider blink-speed"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
