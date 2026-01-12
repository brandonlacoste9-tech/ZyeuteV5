import "vitest";

interface CustomMatchers<R = unknown> {
  toBeInTheDocument(): R;
  toBeDisabled(): R;
  toHaveAttribute(attr: string, value?: string): R;
  toHaveLength(length: number): R;
  toContain(text: string): R;
  toHaveBeenCalledTimes(count: number): R;
  toHaveValue(value: any): R;
  toBeActive(): R;
  toHaveClass(className: string): R;
  toBeVisible(): R;
}

declare module "vitest" {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
