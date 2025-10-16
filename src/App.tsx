import { useState, useEffect } from 'react'
import { useLocalStorage } from '@uidotdev/usehooks'
import './App.css'
import { ColorButton } from './ColorButton'
import OrientationOverlay from './OrientationOverlay'
import { Color, rgbToP3, PRESET_COLORS } from './utils'

type MaskShape = 'none' | 'circle' | 'square' | 'star' | 'triangle'

const TRIANGLE_WIDTH_EXTRA = 10

function App() {
  const [color, setColor] = useState<Color>({ r: 255, g: 255, b: 255 })
  const [brightness, setBrightness] = useState(100)
  const [blinkSpeed, setBlinkSpeed] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [isVisible, setIsVisible] = useState(true)
  const [customColors, setCustomColors] = useLocalStorage<(Color | null)[]>('light-panel-custom-colors', [null, null, null, null])
  const [maskShape, setMaskShape] = useLocalStorage<MaskShape>('light-panel-mask-shape', 'none')
  const [maskSize, setMaskSize] = useLocalStorage<number>('light-panel-mask-size', 70)
  const [isMuted, setIsMuted] = useLocalStorage<boolean>('light-panel-muted', false)

  // Handle blinking
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

  // Handle metronome click sound
  useEffect(() => {
    if (isMuted || blinkSpeed === 0) {
      return
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Higher click when visible, lower click when not visible
    oscillator.frequency.value = isVisible ? 800 : 400
    oscillator.type = 'sine'

    // Use envelope to create a click instead of continuous tone
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.02)
    gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.02)

    oscillator.start()

    return () => {
      oscillator.stop()
      audioContext.close()
    }
  }, [isMuted, isVisible, blinkSpeed])

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

    const handleClick = (e: PointerEvent) => {
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

    window.addEventListener('pointerdown', handleClick)

    return () => {
      clearTimeout(timeout)
      window.removeEventListener('pointerdown', handleClick)
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
    ? rgbToP3(adjustedColor)
    : 'color(display-p3 0 0 0)'

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

  const getMaskStyle = () => {
    const size = `min(${maskSize}vw, ${maskSize}vh)`
    const baseStyle = { backgroundColor }

    if (maskShape === 'triangle') {
      return {
        ...baseStyle,
        width: `min(${maskSize + TRIANGLE_WIDTH_EXTRA}vw, ${maskSize + TRIANGLE_WIDTH_EXTRA}vh)`,
        height: size,
      }
    }

    return {
      ...baseStyle,
      width: size,
      height: size,
    }
  }
  return (
    <div className="app" style={{ backgroundColor: maskShape === 'none' ? backgroundColor : rgbToP3({ r: 0, g: 0, b: 0 }) }}>
      <OrientationOverlay />
      {maskShape !== 'none' && (
        <div
          className={`mask mask-${maskShape}`}
          style={getMaskStyle()}
        />
      )}
      <div className={`controls ${showControls ? 'visible' : 'hidden'}`}>
        <div className="controls-content">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3>Light Panel</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="fullscreen-button"
                aria-label={isMuted ? "Unmute blink sound" : "Mute blink sound"}
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
              <button
                className="fullscreen-button"
                aria-label="Toggle fullscreen mode"
                onClick={() => {
                  if (!document.fullscreenElement) {
                    try {
                      document.documentElement.requestFullscreen()
                    } catch (error) {
                      console.error('Failed to enter fullscreen:', error)
                    }
                  } else {
                    try {
                      document.exitFullscreen()
                    } catch (error) {
                      console.error('Failed to exit fullscreen:', error)
                    }
                  }
                }}
              >
                ⛶
              </button>
            </div>
          </div>

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

          <div className="section">
            <h3>Mask Shape</h3>
            <div className="mask-selector">
              <button
                className={`mask-button ${maskShape === 'none' ? 'active' : ''}`}
                onClick={() => setMaskShape('none')}
              >
                None
              </button>
              <button
                className={`mask-button ${maskShape === 'circle' ? 'active' : ''}`}
                onClick={() => setMaskShape('circle')}
              >
                ●
              </button>
              <button
                className={`mask-button ${maskShape === 'square' ? 'active' : ''}`}
                onClick={() => setMaskShape('square')}
              >
                ■
              </button>
              <button
                className={`mask-button ${maskShape === 'star' ? 'active' : ''}`}
                onClick={() => setMaskShape('star')}
              >
                ★
              </button>
              <button
                className={`mask-button ${maskShape === 'triangle' ? 'active' : ''}`}
                onClick={() => setMaskShape('triangle')}
              >
                ▲
              </button>
            </div>
          </div>

          {maskShape !== 'none' && (
            <div className="section">
              <h3>Mask Size: {maskSize}%</h3>
              <div className="mask-size-controls">
                <button
                  className="size-button"
                  onClick={() => setMaskSize(Math.max(10, maskSize - 5))}
                  aria-label="Decrease mask size"
                >
                  −
                </button>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={maskSize}
                  onChange={(e) => setMaskSize(parseInt(e.target.value))}
                  className="slider mask-size"
                />
                <button
                  className="size-button"
                  onClick={() => setMaskSize(Math.min(100, maskSize + 5))}
                  aria-label="Increase mask size"
                >
                  +
                </button>
              </div>
            </div>
          )}

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
        </div>
      </div>
    </div>
  )
}

export default App
