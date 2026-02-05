/**
 * Shared constants across the application
 */

// Guest mode session duration (24 hours in milliseconds)
export const GUEST_SESSION_DURATION = 24 * 60 * 60 * 1000;

// LocalStorage keys for guest mode
export const GUEST_MODE_KEY = "zyeute_guest_mode";
export const GUEST_TIMESTAMP_KEY = "zyeute_guest_timestamp";
export const GUEST_VIEWS_KEY = "zyeute_guest_views_count";

// Media stack: target seconds of buffer before play (for tuning prefetch / QoE). MSE keeps 30s window behind playhead.
export const INITIAL_BUFFER_TARGET_SECONDS = 10;
