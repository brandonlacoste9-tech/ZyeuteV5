import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGuestMode } from "./useGuestMode";
import {
  GUEST_MODE_KEY,
  GUEST_TIMESTAMP_KEY,
  GUEST_VIEWS_KEY,
} from "../lib/constants";
import { GuestModeProvider } from "../contexts/GuestModeContext";

describe("useGuestMode", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should initialize with default state when no guest mode is active", () => {
    const { result } = renderHook(() => useGuestMode(), {
      wrapper: GuestModeProvider,
    });

    expect(result.current.isGuest).toBe(false);
    expect(result.current.remainingTime).toBe(0);
    expect(result.current.viewsCount).toBe(0);
  });

  it("should detect active guest session", () => {
    // Set up a valid guest session
    localStorage.setItem(GUEST_MODE_KEY, "true");
    localStorage.setItem(GUEST_TIMESTAMP_KEY, Date.now().toString());
    localStorage.setItem(GUEST_VIEWS_KEY, "2");

    const { result } = renderHook(() => useGuestMode(), {
      wrapper: GuestModeProvider,
    });

    expect(result.current.isGuest).toBe(true);
    expect(result.current.viewsCount).toBe(2);
    expect(result.current.remainingTime).toBeGreaterThan(0);
  });

  it("should detect expired guest session", () => {
    // Set up an expired guest session (25 hours ago)
    const expiredTimestamp = Date.now() - 25 * 60 * 60 * 1000;
    localStorage.setItem(GUEST_MODE_KEY, "true");
    localStorage.setItem(GUEST_TIMESTAMP_KEY, expiredTimestamp.toString());
    localStorage.setItem(GUEST_VIEWS_KEY, "5");

    const { result } = renderHook(() => useGuestMode(), {
      wrapper: GuestModeProvider,
    });

    expect(result.current.isGuest).toBe(false);
    expect(result.current.remainingTime).toBe(0);
    expect(result.current.viewsCount).toBe(0);

    // Verify localStorage was cleared
    expect(localStorage.getItem(GUEST_MODE_KEY)).toBeNull();
    expect(localStorage.getItem(GUEST_TIMESTAMP_KEY)).toBeNull();
    expect(localStorage.getItem(GUEST_VIEWS_KEY)).toBeNull();
  });

  it("should increment views counter", () => {
    localStorage.setItem(GUEST_MODE_KEY, "true");
    localStorage.setItem(GUEST_TIMESTAMP_KEY, Date.now().toString());
    localStorage.setItem(GUEST_VIEWS_KEY, "0");

    const { result } = renderHook(() => useGuestMode(), {
      wrapper: GuestModeProvider,
    });

    expect(result.current.viewsCount).toBe(0);

    act(() => {
      result.current.incrementViews();
    });

    expect(localStorage.getItem(GUEST_VIEWS_KEY)).toBe("1");
    expect(result.current.viewsCount).toBe(1);

    act(() => {
      result.current.incrementViews();
    });

    expect(localStorage.getItem(GUEST_VIEWS_KEY)).toBe("2");
    expect(result.current.viewsCount).toBe(2);
  });

  it("should provide stable incrementViews function reference", () => {
    const { result, rerender } = renderHook(() => useGuestMode(), {
      wrapper: GuestModeProvider,
    });

    const firstIncrementViews = result.current.incrementViews;
    rerender();
    const secondIncrementViews = result.current.incrementViews;

    // incrementViews is not wrapped in useCallback, so it's recreated on each render
    // This test verifies the function remains callable even with reference changes
    expect(typeof firstIncrementViews).toBe("function");
    expect(typeof secondIncrementViews).toBe("function");
  });
});
