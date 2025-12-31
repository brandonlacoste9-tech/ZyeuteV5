import * as React from "react";
import { cn } from "@/lib/utils";

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: number[]) => void;
  defaultValue?: number[];
  value?: number[];
  max?: number;
  step?: number;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      className,
      onValueChange,
      defaultValue,
      value,
      max = 100,
      step = 1,
      ...props
    },
    ref,
  ) => {
    // Handle array value/defaultValue for compatibility with strict Slider props
    const safeValue = value ? value[0] : defaultValue ? defaultValue[0] : 0;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onValueChange) {
        onValueChange([parseFloat(e.target.value)]);
      }
      if (props.onChange) {
        props.onChange(e);
      }
    };

    return (
      <input
        type="range"
        ref={ref}
        className={cn(
          "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700",
          className,
        )}
        min={0}
        max={max}
        step={step}
        value={safeValue}
        onChange={handleChange}
        {...props}
      />
    );
  },
);
Slider.displayName = "Slider";

export { Slider };
