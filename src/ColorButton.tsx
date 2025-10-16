import { useState, useRef } from 'react'
import { useLongPress } from '@uidotdev/usehooks'
import { Color, rgbToP3 } from './utils'

interface ColorButtonProps {
  color: Color
  name: string
  onClick: () => void
  onLongPress?: (color: Color) => void
  longPressColor?: Color
  isPressing?: boolean
}

export function ColorButton({ color, name, onClick, onLongPress, longPressColor }: ColorButtonProps) {
  const [isPressing, setIsPressing] = useState(false)
  const isCurrentlyPressing = useRef(false)
  const longPressTriggered = useRef(false)
  // 1 second in ms
  const threshold = 600
  const longPressAttrs = onLongPress ? useLongPress(
    () => {
      longPressTriggered.current = true
      onLongPress(longPressColor || color)
      // Reset the pressing state after the callback completes
      setTimeout(() => {
        setIsPressing(false)
        longPressTriggered.current = false
      }, threshold)
    },
    {
      onStart: () => {
        isCurrentlyPressing.current = true
        longPressTriggered.current = false
        // Wait 200ms before showing the pressing state
        // to avoid flickering on quick taps
        // Only show if user is still pressing after 200ms
        setTimeout(() => {
          if (isCurrentlyPressing.current) {
            setIsPressing(true)
          }
        }, 200)
      },
      onFinish: () => {
        isCurrentlyPressing.current = false
        setIsPressing(false)
      },
      onCancel: () => {
        isCurrentlyPressing.current = false
        setIsPressing(false)
      },
      threshold: threshold,
    }
  ) : {}

  const displayColor = isPressing && longPressColor
    ? longPressColor
    : color

  return (
    <button
      {...longPressAttrs}
      className={`preset-button ${isPressing ? 'pressing' : ''}`}
      style={{
        backgroundColor: rgbToP3(displayColor),
      }}
      onClick={() => {
        // Only block the click if a long press was actually triggered
        // Normal short clicks should always work
        if (!longPressTriggered.current) {
          onClick()
        }
      }}
      title={name}
    >
      {isPressing ? 'Saving...' : name}
    </button>
  )
}
