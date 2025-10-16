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
  const [currentBlinkIndex, setCurrentBlinkIndex] = useState(0)
  const [customColors, setCustomColors] = useLocalStorage<Color[]>('light-panel-custom-colors', [
    { r: 255, g: 0, b: 0 },
    { r: 0, g: 0, b: 255 }
  ])
  const [maskShape, setMaskShape] = useLocalStorage<MaskShape>('light-panel-mask-shape', 'none')
  const [maskSize, setMaskSize] = useLocalStorage<number>('light-panel-mask-size', 70)
  const [isMuted, setIsMuted] = useLocalStorage<boolean>('light-panel-muted', false)
  const [useCustomColorsForBlink, setUseCustomColorsForBlink] = useLocalStorage<boolean>('light-panel-use-custom-colors-blink', true)
  const [useStrobeEffect, setUseStrobeEffect] = useLocalStorage<boolean>('light-panel-use-strobe', true)
  const [isShowingBlack, setIsShowingBlack] = useState(false)

  // Handle blinking - rotate through custom colors with strobe effect
  useEffect(() => {
    if (blinkSpeed === 0) {
      setCurrentBlinkIndex(0)
      setIsShowingBlack(false)
      return
    }

    const interval = setInterval(() => {
      // If not using custom colors, always strobe (single color on/off)
      // If using custom colors, respect the strobe setting
      const shouldStrobe = !useCustomColorsForBlink || useStrobeEffect

      if (shouldStrobe) {
        // Strobe mode: alternate between color and black
        setIsShowingBlack(prev => {
          if (!prev) {
            // Currently showing color, next show black
            return true
          } else {
            // Currently showing black, advance to next color
            setCurrentBlinkIndex(prev => (prev + 1) % customColors.length)
            return false
          }
        })
      } else {
        // No strobe: just cycle through colors
        setCurrentBlinkIndex(prev => (prev + 1) % customColors.length)
        setIsShowingBlack(false)
      }
    }, blinkSpeed)

    return () => clearInterval(interval)
  }, [blinkSpeed, customColors.length, useStrobeEffect, useCustomColorsForBlink])

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

    // High note when showing color, low note when showing black
    oscillator.frequency.value = isShowingBlack ? 300 : 600
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
  }, [isMuted, currentBlinkIndex, blinkSpeed, isShowingBlack])

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

  // Use the current blink color when blinking, otherwise use the selected color
  let displayColor: Color

  // Determine if strobe should be active
  const shouldStrobe = !useCustomColorsForBlink || useStrobeEffect

  // If blinking is active and strobe is enabled, show black on alternate beats
  if (blinkSpeed > 0 && isShowingBlack && shouldStrobe) {
    displayColor = { r: 0, g: 0, b: 0 }
  } else if (blinkSpeed > 0 && useCustomColorsForBlink && customColors.length > 0) {
    // Blinking with custom colors
    displayColor = (currentBlinkIndex >= 0 && currentBlinkIndex < customColors.length)
      ? customColors[currentBlinkIndex]
      : color
  } else {
    // Not blinking or blinking with single selected color
    displayColor = color
  }

  const adjustedColor = applyBrightness(displayColor, brightness)
  const backgroundColor = rgbToP3(adjustedColor)

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

  const addCustomColorSlot = (newColor: Color) => {
    if (customColors.length < 8) {
      setCustomColors([...customColors, newColor])
    }
  }

  const updateCustomColor = (index: number, newColor: Color) => {
    const newColors = [...customColors]
    newColors[index] = newColor
    setCustomColors(newColors)
  }

  const clearCustomColors = () => {
    setCustomColors([
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 0, b: 255 }
    ])
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
            {blinkSpeed > 0 && (
              <>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={useCustomColorsForBlink}
                    onChange={(e) => setUseCustomColorsForBlink(e.target.checked)}
                  />
                  <span>Use Custom Colors for Blinking</span>
                </label>
                {useCustomColorsForBlink && (
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={useStrobeEffect}
                      onChange={(e) => setUseStrobeEffect(e.target.checked)}
                    />
                    <span>Strobe Effect (Black Between Colors)</span>
                  </label>
                )}
              </>
            )}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3>Custom Colors</h3>
              <button
                className="clear-button"
                onClick={clearCustomColors}
                title="Reset to default 2 colors"
              >
                Clear
              </button>
            </div>
            <div className="custom-colors-grid">
              {customColors.map((customColor, index) => (
                <ColorButton
                  key={index}
                  color={customColor}
                  name={`Slot ${index + 1}`}
                  onClick={() => setColor(customColor)}
                  onLongPress={(newColor) => updateCustomColor(index, newColor)}
                  longPressColor={color}
                />
              ))}
              {customColors.length < 8 && (
                <button
                  className="preset-button add-color-button"
                  onClick={() => addCustomColorSlot(color)}
                  title="Add current color to custom colors"
                >
                  +
                </button>
              )}
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
