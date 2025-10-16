import { useState, useRef } from 'react'
import { useLongPress } from '@uidotdev/usehooks'

interface Color {
  r: number
  g: number
  b: number
}

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
  const wasCancelled = useRef(false)
  // 1 second in ms
  const threshold = 600
  const longPressAttrs = onLongPress ? useLongPress(
    () => {
      onLongPress(longPressColor || color)
      // Reset the pressing state after the callback completes
      setTimeout(() => setIsPressing(false), threshold)
    },
    {
      onStart: () => {
        isCurrentlyPressing.current = true
        wasCancelled.current = false
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
        wasCancelled.current = true
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
        backgroundColor: `rgb(${displayColor.r}, ${displayColor.g}, ${displayColor.b})`,
      }}
      onClick={() => {
        if (!isPressing && !wasCancelled.current) {
          onClick()
        }
        // Reset the cancelled flag after handling the click
        wasCancelled.current = false
      }}
      title={name}
    >
      {isPressing ? 'Saving...' : name}
    </button>
  )
}
