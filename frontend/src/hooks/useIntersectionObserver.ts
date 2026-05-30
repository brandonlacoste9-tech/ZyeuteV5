import { useEffect, useState, useRef, RefObject } from "react";

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | Document | null;
  rootMargin?: string;
}

/**
 * Custom hook to track which elements are visible in the viewport
 * Returns the ID of the element that is most visible (centered)
 */
export const useIntersectionObserver = (
  items: string[],
  options: UseIntersectionObserverOptions = { threshold: 0.6 },
) => {
  const { threshold, root, rootMargin } = options;
  const [activeId, setActiveId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRefs = useRef<Map<string, Element>>(new Map());

  const setRef = (id: string) => (element: Element | null) => {
    if (element) {
      elementRefs.current.set(id, element);
      observerRef.current?.observe(element);
    } else {
      elementRefs.current.delete(id);
    }
  };

  useEffect(() => {
    const handleIntersect: IntersectionObserverCallback = (entries) => {
      // Find the entry with the highest intersection ratio
      const mostVisible = entries.reduce((prev, current) => {
        return prev.intersectionRatio > current.intersectionRatio
          ? prev
          : current;
      });

      if (mostVisible.isIntersecting && mostVisible.intersectionRatio > 0.5) {
        // Get the ID from the target element's data attribute or map lookup
        // For simplicity, we assume we can map back or just check against our set
        const id = Array.from(elementRefs.current.entries()).find(
          ([_, el]) => el === mostVisible.target,
        )?.[0];

        if (id) setActiveId(id);
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersect, {
      threshold: threshold || [0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      root,
      rootMargin,
    });

    // Observe all currently registered elements
    elementRefs.current.forEach((el) => observerRef.current?.observe(el));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold, root, rootMargin]);

  return { activeId, setRef };
};
