import React, { useCallback, useEffect, useRef } from "react";
import {
  List,
  useDynamicRowHeight,
  ListImperativeAPI,
  RowComponentProps,
} from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { Comment as CommentType, User } from "../../types";
import { CommentThread } from "./CommentThread";

interface VirtualCommentListProps {
  comments: CommentType[];
  postId: string;
  currentUser: User | null;
  className?: string;
}

interface ItemData {
  comments: CommentType[];
  postId: string;
  currentUser: User | null;
  setRowHeight: (index: number, size: number) => void;
}

// Custom hook to measure row height
const useRowMeasurement = (
  index: number,
  setRowHeight: (index: number, size: number) => void,
) => {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rowRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const height =
            entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
          if (height > 0) {
            setRowHeight(index, height);
          }
        }
      });

      resizeObserver.observe(rowRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [index, setRowHeight]);

  return rowRef;
};

const Row = React.memo(
  ({
    index,
    style,
    ariaAttributes,
    comments,
    postId,
    currentUser,
    setRowHeight,
  }: RowComponentProps<ItemData>) => {
    const comment = comments[index];
    const rowRef = useRowMeasurement(index, setRowHeight);

    if (!comment) return <></>;

    return (
      <div style={style} {...ariaAttributes}>
        <div ref={rowRef} style={{ paddingBottom: "16px" }}>
          <CommentThread
            comment={comment}
            postId={postId}
            currentUser={currentUser}
          />
        </div>
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.index === next.index &&
      prev.style.top === next.style.top &&
      prev.style.height === next.style.height &&
      prev.comments[prev.index] === next.comments[next.index] &&
      prev.currentUser?.id === next.currentUser?.id
    );
  },
);

export const VirtualCommentList: React.FC<VirtualCommentListProps> = ({
  comments,
  postId,
  currentUser,
  className = "",
}) => {
  const listRef = useRef<ListImperativeAPI>(null);

  // React Window 2.x dynamic sizing hook
  // We use a unique key to force reset if comments length drops to 0 or similar critical changes,
  // though usually list handles updates.
  const dynamicRowHeight = useDynamicRowHeight({
    defaultRowHeight: 150,
    key: comments.length === 0 ? "empty" : "content",
  });

  if (comments.length === 0) {
    return (
      <div className={`text-center text-white/40 py-8 ${className}`}>
        Pas encore de commentaires. Sois le premier!
      </div>
    );
  }

  return (
    <div className={`w-full flex-1 min-h-0 ${className}`}>
      <AutoSizer>
        {({ height, width }) => (
          <List<ItemData>
            listRef={listRef}
            style={{ height, width }}
            rowCount={comments.length}
            rowHeight={dynamicRowHeight}
            rowComponent={
              Row as unknown as (
                props: RowComponentProps<ItemData>,
              ) => React.ReactElement
            }
            rowProps={{
              comments,
              postId,
              currentUser,
              setRowHeight: dynamicRowHeight.setRowHeight,
            }}
            overscanCount={2}
          />
        )}
      </AutoSizer>
    </div>
  );
};
