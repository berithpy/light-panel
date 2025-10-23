import { useState, useEffect, useCallback } from 'react'
import { useLocalStorage } from '@uidotdev/usehooks'
import './App.css'
import { ColorButton } from './ColorButton'
import OrientationOverlay from './OrientationOverlay'
import { Color, rgbToP3, PRESET_COLORS } from './utils'

type MaskShape = 'none' | 'circle' | 'square' | 'star' | 'triangle' | 'heart' | 'heart-solid'

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
  const [selectedMaskShapes, setSelectedMaskShapes] = useLocalStorage<MaskShape[]>('light-panel-mask-shapes', ['none'])
  const [currentMaskIndex, setCurrentMaskIndex] = useState(0)
  const [maskSize, setMaskSize] = useLocalStorage<number>('light-panel-mask-size', 70)
  const [isMuted, setIsMuted] = useLocalStorage<boolean>('light-panel-muted', true)
  const [useCustomColorsForBlink, setUseCustomColorsForBlink] = useLocalStorage<boolean>('light-panel-use-custom-colors-blink', true)
  const [useStrobeEffect, setUseStrobeEffect] = useLocalStorage<boolean>('light-panel-use-strobe', true)
  const [isShowingBlack, setIsShowingBlack] = useState(false)
  const [showAllCustomColors, setShowAllCustomColors] = useLocalStorage<boolean>('light-panel-show-all-custom-colors', false)
  const [horizontalColorSplit, setHorizontalColorSplit] = useLocalStorage<boolean>('light-panel-horizontal-color-split', true)

  // Helper function to get shapes that should rotate (excluding 'none')
  const getShapeRotation = () => selectedMaskShapes.filter(s => s !== 'none')

  // Helper function to advance to next mask if multiple shapes are selected
  const advanceToNextMask = () => {
    const shapesToRotate = getShapeRotation()
    if (shapesToRotate.length > 1) {
      setCurrentMaskIndex(prev => (prev + 1) % shapesToRotate.length)
    }
  }

  // Handle blinking - rotate through custom colors and mask shapes with strobe effect
  useEffect(() => {
    if (blinkSpeed === 0) {
      setCurrentBlinkIndex(0)
      setCurrentMaskIndex(0)
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
            // Currently showing black, advance to next color and mask
            setCurrentBlinkIndex(prev => (prev + 1) % customColors.length)
            advanceToNextMask()
            return false
          }
        })
      } else {
        // No strobe: just cycle through colors and masks
        setCurrentBlinkIndex(prev => (prev + 1) % customColors.length)
        advanceToNextMask()
        setIsShowingBlack(false)
      }
    }, blinkSpeed)

    return () => clearInterval(interval)
  }, [blinkSpeed, customColors.length, useStrobeEffect, useCustomColorsForBlink, selectedMaskShapes])

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

  const applyBrightness = useCallback((color: Color, brightness: number): Color => {
    const factor = brightness / 100
    return {
      r: Math.round(color.r * factor),
      g: Math.round(color.g * factor),
      b: Math.round(color.b * factor),
    }
  }, [])

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

  // Create split background gradient for custom colors
  const getSplitBackground = (useBlinkColor: boolean = false): string => {
    if (!showAllCustomColors || customColors.length < 2) {
      return backgroundColor
    }

    // When blinking with strobe effect showing black, return black for all splits
    if (useBlinkColor && blinkSpeed > 0 && isShowingBlack && shouldStrobe) {
      return rgbToP3({ r: 0, g: 0, b: 0 })
    }

    const percentage = 100 / customColors.length
    const gradientStops = customColors.map((color, index) => {
      const adjustedColor = applyBrightness(color, brightness)
      const colorString = rgbToP3(adjustedColor)
      const startPercent = index * percentage
      const endPercent = (index + 1) * percentage
      return `${colorString} ${startPercent}%, ${colorString} ${endPercent}%`
    }).join(', ')

    const direction = horizontalColorSplit ? 'to bottom' : 'to right'
    return `linear-gradient(${direction}, ${gradientStops})`
  }

  const backgroundStyle = showAllCustomColors && customColors.length >= 2
    ? getSplitBackground(true)
    : backgroundColor

  const rgbToHex = useCallback((color: Color): string => {
    const toHex = (n: number) => n.toString(16).padStart(2, '0')
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`
  }, [])

  const hexToRgb = useCallback((hex: string): Color => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
      : { r: 0, g: 0, b: 0 }
  }, [])

  const addCustomColorSlot = useCallback((newColor: Color) => {
    if (customColors.length < 8) {
      setCustomColors([...customColors, newColor])
    }
  }, [customColors, setCustomColors])

  const updateCustomColor = useCallback((index: number, newColor: Color) => {
    const newColors = [...customColors]
    newColors[index] = newColor
    setCustomColors(newColors)
  }, [customColors, setCustomColors])

  const clearCustomColors = useCallback(() => {
    setCustomColors([
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 0, b: 255 }
    ])
  }, [setCustomColors])

  // Helper function to toggle mask shape selection
  const toggleMaskShape = useCallback((shape: MaskShape) => {
    if (shape === 'none') {
      // If clicking 'none', set only 'none'
      setSelectedMaskShapes(['none'])
      setCurrentMaskIndex(0)
    } else {
      setSelectedMaskShapes(prev => {
        // Remove 'none' if present
        const withoutNone = prev.filter(s => s !== 'none')

        if (withoutNone.includes(shape)) {
          // If shape is already selected, remove it
          const newShapes = withoutNone.filter(s => s !== shape)
          // If no shapes left, default to 'none'
          return newShapes.length === 0 ? ['none'] : newShapes
        } else {
          // Add the shape
          return [...withoutNone, shape]
        }
      })
    }
  }, [setSelectedMaskShapes, setCurrentMaskIndex])

  // Get the current mask shape to display
  const getCurrentMaskShape = (): MaskShape => {
    const shapesToShow = getShapeRotation()
    if (shapesToShow.length === 0) return 'none'
    if (shapesToShow.length === 1) return shapesToShow[0]
    // When blinking with multiple shapes, rotate through them
    if (blinkSpeed > 0) {
      return shapesToShow[currentMaskIndex % shapesToShow.length]
    }
    // When not blinking, show the first selected shape
    return shapesToShow[0]
  }

  const currentMaskShape = getCurrentMaskShape()

  const getMaskStyle = () => {
    const size = `min(${maskSize}vw, ${maskSize}vh)`
    const maskBackground = showAllCustomColors && customColors.length >= 2
      ? getSplitBackground(true)
      : backgroundColor
    const baseStyle = { background: maskBackground }

    if (currentMaskShape === 'triangle') {
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

  const hasAnyMaskActive = selectedMaskShapes.length > 0 && !selectedMaskShapes.includes('none')

  return (
    <div
      className="app"
      style={{
        background: hasAnyMaskActive
          ? rgbToP3({ r: 0, g: 0, b: 0 })
          : backgroundStyle
      }}
    >
      <OrientationOverlay />
      {hasAnyMaskActive && (
        <div
          className={`mask mask-${currentMaskShape}`}
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
                <div className="mask-selector">
                  <button
                    className={`mask-button ${useCustomColorsForBlink ? 'active' : ''}`}
                    onClick={() => setUseCustomColorsForBlink(!useCustomColorsForBlink)}
                    style={{ gridColumn: '1 / -1' }}
                  >
                    Rotate colors
                  </button>
                </div>
                {useCustomColorsForBlink && (
                  <div className="mask-selector">
                    <button
                      className={`mask-button ${useStrobeEffect ? 'active' : ''}`}
                      onClick={() => setUseStrobeEffect(!useStrobeEffect)}
                      style={{ gridColumn: '1 / -1' }}
                    >
                      Strobe Effect
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="section">
            <h3>Mask Shape {selectedMaskShapes.filter(s => s !== 'none').length > 1 ? '(Multiple)' : ''}</h3>
            <div className="mask-selector">
              <button
                className={`mask-button ${selectedMaskShapes.includes('none') && selectedMaskShapes.length === 1 ? 'active' : ''}`}
                onClick={() => toggleMaskShape('none')}
              >
                None
              </button>
              <button
                className={`mask-button ${selectedMaskShapes.includes('circle') ? 'active' : ''}`}
                onClick={() => toggleMaskShape('circle')}
              >
                ●
              </button>
              <button
                className={`mask-button ${selectedMaskShapes.includes('square') ? 'active' : ''}`}
                onClick={() => toggleMaskShape('square')}
              >
                ■
              </button>
              <button
                className={`mask-button ${selectedMaskShapes.includes('triangle') ? 'active' : ''}`}
                onClick={() => toggleMaskShape('triangle')}
              >
                ▲
              </button>
              <button
                className={`mask-button ${selectedMaskShapes.includes('star') ? 'active' : ''}`}
                onClick={() => toggleMaskShape('star')}
              >
                ★
              </button>
              <button
                className={`mask-button ${selectedMaskShapes.includes('heart') ? 'active' : ''}`}
                onClick={() => toggleMaskShape('heart')}
              >
                ♡
              </button>
              <button
                className={`mask-button ${selectedMaskShapes.includes('heart-solid') ? 'active' : ''}`}
                onClick={() => toggleMaskShape('heart-solid')}
              >
                ♥
              </button>
            </div>
          </div>

          {hasAnyMaskActive && (
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
            {customColors.length >= 2 && (
              <div className="mask-selector">
                <button
                  className={`mask-button ${showAllCustomColors ? 'active' : ''}`}
                  onClick={() => setShowAllCustomColors(!showAllCustomColors)}
                  style={{ gridColumn: '1 / -1' }}
                >
                  Flag Mode
                </button>
              </div>
            )}
            {showAllCustomColors && customColors.length >= 2 && (
              <div className="flag-selector">
                <button
                  className={`mask-button ${!horizontalColorSplit ? 'active' : ''}`}
                  onClick={() => setHorizontalColorSplit(false)}
                  style={{ width: '100%' }}
                >
                  Vertical
                </button>
                <button
                  className={`mask-button ${horizontalColorSplit ? 'active' : ''}`}
                  onClick={() => setHorizontalColorSplit(true)}
                  style={{ width: '100%' }}

                >
                  Horizontal
                </button>
              </div>
            )}
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

          <div className="section about-section">
            <p>
              Made by <a href="https://berith.moe" target="_blank" rel="noopener noreferrer">berith.moe</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
