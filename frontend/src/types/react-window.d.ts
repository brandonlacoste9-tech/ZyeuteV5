declare module "react-window" {
  import { ComponentType, CSSProperties, LegacyRef, ReactNode } from "react";

  export type ListChildComponentProps<T = any> = {
    index: number;
    style: CSSProperties;
    data: T;
    [key: string]: any; // Allow other props passed by react-window v2 or spread
  };

  export interface ListImperativeAPI {
    scrollTo(offset: number): void;
    scrollToItem(
      index: number,
      align?: "auto" | "smart" | "center" | "end" | "start",
    ): void;
    [key: string]: any;
  }

  export type ListProps<T = any> = {
    height?: number | string;
    width?: number | string;
    rowCount?: number;
    rowHeight?: number | ((index: number) => number);
    itemData?: T;
    children?:
      | ComponentType<ListChildComponentProps<T>>
      | ReactNode
      | ((props: ListChildComponentProps<T>) => ReactNode);
    rowComponent?: ComponentType<any>;
    outerRef?: LegacyRef<any>;
    innerRef?: LegacyRef<any>;
    listRef?: LegacyRef<any>;
    ref?: LegacyRef<ListImperativeAPI>;
    onItemsRendered?: (props: any) => void;
    onScroll?: (props: any) => void;
    overscanCount?: number;
    className?: string;
    style?: CSSProperties;
    [key: string]: any;
  };

  export class List<T = any> extends React.Component<ListProps<T>> {}
  export class FixedSizeList<T = any> extends React.Component<ListProps<T>> {}
  export class VariableSizeList<T = any> extends React.Component<
    ListProps<T>
  > {}
  export class Grid<T = any> extends React.Component<any> {}

  // v2 Hooks & Utilities
  export function useDynamicRowHeight(args?: any): any;
  export function useGridCallbackRef(args?: any): any;
  export function useGridRef(args?: any): any;
  export function useListCallbackRef(args?: any): any;
  export function useListRef(args?: any): any;
  export function getScrollbarSize(): number;

  export type RowComponentProps<T = any> = ListChildComponentProps<T>;
}
