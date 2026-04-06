import { Link } from "react-router-dom";

/**
 * Renders caption text with #hashtags as links to explore search.
 */
export function CaptionWithHashtags({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const parts = text.split(/(\s+)/);
  return (
    <p className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("#") && part.length > 1) {
          const tag = part.slice(1).replace(/[^\wÀ-ÿ]/g, "");
          if (!tag) return <span key={i}>{part}</span>;
          return (
            <Link
              key={i}
              to={`/explore?tag=${encodeURIComponent(tag)}`}
              className="text-gold-400 font-semibold hover:underline"
            >
              {part}
            </Link>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}
