declare module "@google/generative-ai";
declare module "@vercel/otel";
declare module "socket.io-client" {
  export interface Socket {
    on(event: string, callback: (...args: any[]) => void): void;
    emit(event: string, ...args: any[]): void;
    disconnect(): void;
    connected: boolean;
    disconnected: boolean;
    off(event: string, callback?: (...args: any[]) => void): void;
  }
  export const io: any;
}

declare module "@tanstack/react-query-devtools";
declare module "@google-cloud/vertexai";
declare module "@fal-ai/client";
declare module "@mux/upchunk";
declare module "uuid";

declare module "@testing-library/react" {
  export const screen: any;
  export const waitFor: any;
  export const within: any;
  export const fireEvent: any;
  export const render: any;
  export const cleanup: any;
  export const renderHook: any;
  export const act: any;
  export type RenderOptions = any;
}

interface CustomMatchers<R = unknown> {
  toBeInTheDocument(): R;
  toBeDisabled(): R;
  toHaveAttribute(attr: string, value?: string): R;
  toHaveLength(length: number): R;
  toContain(text: string): R;
  toHaveBeenCalledTimes(count: number): R;
  toHaveValue(value: any): R;
  toBeActive(): R;
}
