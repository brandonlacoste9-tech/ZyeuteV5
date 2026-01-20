/**
 * useDesignValidation Hook
 * Validate UI components for Quebec compliance in real-time
 */

"use client";

import { useState, useCallback } from "react";

interface ValidationResult {
  compliant: boolean;
  suggestions: string[];
  quebec_colors: Record<string, any>;
  component_type?: string;
}

export function useDesignValidation() {
  const [validating, setValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<ValidationResult | null>(
    null,
  );

  const validate = useCallback(
    async (
      componentCode: string,
      componentType?: "button" | "alert" | "form" | "card" | "navigation",
    ): Promise<ValidationResult> => {
      setValidating(true);
      try {
        const response = await fetch("/api/validate-design", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            component_code: componentCode,
            component_type: componentType,
          }),
        });
        const result = await response.json();
        setLastValidation(result);
        return result;
      } catch (error) {
        const errResult: ValidationResult = {
          compliant: false,
          suggestions: ["Validation service unavailable"],
          quebec_colors: {},
        };
        setLastValidation(errResult);
        return errResult;
      } finally {
        setValidating(false);
      }
    },
    [],
  );

  return {
    validate,
    validating,
    lastValidation,
    isCompliant: lastValidation?.compliant ?? null,
  };
}
