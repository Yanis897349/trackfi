import { useEffect, useRef, useState } from "react"

const DEFAULT_SHOW_DELAY = 200
const DEFAULT_MINIMUM_VISIBLE_DURATION = 300

interface StableLoadingStateOptions {
  isLoading: boolean
  isError?: boolean
  showDelay?: number
  minimumVisibleDuration?: number
}

interface StableLoadingState {
  isVisible: boolean
  shouldRender: boolean
}

export function useStableLoadingState({
  isLoading,
  isError = false,
  showDelay = DEFAULT_SHOW_DELAY,
  minimumVisibleDuration = DEFAULT_MINIMUM_VISIBLE_DURATION,
}: StableLoadingStateOptions): StableLoadingState {
  const [visible, setVisible] = useState(false)
  const visibleSince = useRef<number | null>(null)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined

    if (isError) {
      timer = setTimeout(() => {
        visibleSince.current = null
        setVisible(false)
      }, 0)
    } else if (isLoading) {
      if (!visible) {
        timer = setTimeout(
          () => {
            visibleSince.current = Date.now()
            setVisible(true)
          },
          Math.max(0, showDelay)
        )
      }
    } else if (visible) {
      const elapsed = Date.now() - (visibleSince.current ?? Date.now())
      const remaining = Math.max(0, minimumVisibleDuration - elapsed)

      timer = setTimeout(() => {
        visibleSince.current = null
        setVisible(false)
      }, remaining)
    } else {
      visibleSince.current = null
    }

    return () => {
      if (timer !== undefined) clearTimeout(timer)
    }
  }, [isError, isLoading, minimumVisibleDuration, showDelay, visible])

  return {
    isVisible: !isError && visible,
    shouldRender: !isError && (isLoading || visible),
  }
}

export {
  DEFAULT_MINIMUM_VISIBLE_DURATION,
  DEFAULT_SHOW_DELAY,
  type StableLoadingState,
  type StableLoadingStateOptions,
}
