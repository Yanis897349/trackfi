// @vitest-environment jsdom

import { act, render, renderHook, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useStableLoadingState } from "./use-stable-loading-state"
import { Skeleton } from "../components/skeleton"
import { StableLoadingPlaceholder } from "../components/stable-loading-placeholder"

describe("useStableLoadingState", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("never shows the skeleton when loading finishes before the delay", () => {
    const { result, rerender } = renderHook(
      ({ isLoading }) => useStableLoadingState({ isLoading }),
      { initialProps: { isLoading: true } }
    )

    expect(result.current).toEqual({ isVisible: false, shouldRender: true })

    act(() => vi.advanceTimersByTime(199))
    rerender({ isLoading: false })
    act(() => vi.runAllTimers())

    expect(result.current).toEqual({ isVisible: false, shouldRender: false })
  })

  it("shows after the delay and remains visible for the minimum duration", () => {
    const { result, rerender } = renderHook(
      ({ isLoading }) => useStableLoadingState({ isLoading }),
      { initialProps: { isLoading: true } }
    )

    act(() => vi.advanceTimersByTime(200))
    expect(result.current).toEqual({ isVisible: true, shouldRender: true })

    act(() => vi.advanceTimersByTime(50))
    rerender({ isLoading: false })
    act(() => vi.advanceTimersByTime(249))
    expect(result.current).toEqual({ isVisible: true, shouldRender: true })

    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toEqual({ isVisible: false, shouldRender: false })
  })

  it("hides without another delay after a long request completes", () => {
    const { result, rerender } = renderHook(
      ({ isLoading }) => useStableLoadingState({ isLoading }),
      { initialProps: { isLoading: true } }
    )

    act(() => vi.advanceTimersByTime(500))
    rerender({ isLoading: false })
    act(() => vi.runAllTimers())

    expect(result.current).toEqual({ isVisible: false, shouldRender: false })
  })

  it("keeps a visible skeleton mounted when loading restarts", () => {
    const { result, rerender } = renderHook(
      ({ isLoading }) => useStableLoadingState({ isLoading }),
      { initialProps: { isLoading: true } }
    )

    act(() => vi.advanceTimersByTime(200))
    rerender({ isLoading: false })
    act(() => vi.advanceTimersByTime(100))
    rerender({ isLoading: true })
    act(() => vi.advanceTimersByTime(200))

    expect(result.current).toEqual({ isVisible: true, shouldRender: true })

    rerender({ isLoading: false })
    act(() => vi.runAllTimers())
    expect(result.current).toEqual({ isVisible: false, shouldRender: false })
  })

  it("bypasses the minimum duration for errors", () => {
    const { result, rerender } = renderHook(
      ({ isError, isLoading }) => useStableLoadingState({ isError, isLoading }),
      { initialProps: { isError: false, isLoading: true } }
    )

    act(() => vi.advanceTimersByTime(200))
    rerender({ isError: true, isLoading: false })

    expect(result.current).toEqual({ isVisible: false, shouldRender: false })
  })

  it("uses updated timing options and cleans up every timer on unmount", () => {
    const { result, rerender, unmount } = renderHook(
      ({ minimumVisibleDuration, showDelay }) =>
        useStableLoadingState({
          isLoading: true,
          minimumVisibleDuration,
          showDelay,
        }),
      { initialProps: { minimumVisibleDuration: 400, showDelay: 300 } }
    )

    act(() => vi.advanceTimersByTime(200))
    rerender({ minimumVisibleDuration: 250, showDelay: 50 })
    act(() => vi.advanceTimersByTime(49))
    expect(result.current.isVisible).toBe(false)
    act(() => vi.advanceTimersByTime(1))
    expect(result.current.isVisible).toBe(true)

    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it("reserves layout without exposing the delayed status", () => {
    function LoadingHarness() {
      const loading = useStableLoadingState({ isLoading: true })
      return loading.shouldRender ? (
        <StableLoadingPlaceholder
          data-testid="loading-layout"
          isVisible={loading.isVisible}
        >
          <div role="status" aria-label="Loading content">
            <Skeleton className="h-12" />
          </div>
        </StableLoadingPlaceholder>
      ) : null
    }

    render(<LoadingHarness />)

    const layout = screen.getByTestId("loading-layout")
    expect(layout.classList.contains("invisible")).toBe(true)
    expect(layout.getAttribute("aria-hidden")).toBe("true")
    expect(screen.queryByRole("status", { name: "Loading content" })).toBeNull()
    expect(
      screen.getByRole("status", { name: "Loading content", hidden: true })
    ).toBeTruthy()

    act(() => vi.advanceTimersByTime(200))

    expect(layout.classList.contains("invisible")).toBe(false)
    expect(layout.hasAttribute("aria-hidden")).toBe(false)
    expect(screen.getByRole("status", { name: "Loading content" })).toBeTruthy()
    expect(
      layout
        .querySelector('[data-slot="skeleton"]')
        ?.classList.contains("motion-safe:animate-pulse")
    ).toBe(true)
  })
})
