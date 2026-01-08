import { motion } from "framer-motion";

interface FireAnimationProps {
  x: number;
  y: number;
  onComplete: () => void;
}

export function FireAnimation({ x, y, onComplete }: FireAnimationProps) {
  const emojis = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    angle: (Math.PI * 2 * i) / 8,
    distance: 60 + Math.random() * 40,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {emojis.map(({ id, angle, distance }) => (
        <motion.div
          key={id}
          className="absolute text-4xl"
          initial={{ x, y, opacity: 1, scale: 0 }}
          animate={{
            x: x + Math.cos(angle) * distance,
            y: y + Math.sin(angle) * distance,
            opacity: 0,
            scale: 1.5,
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          onAnimationComplete={id === 0 ? onComplete : undefined}
        >
          🔥
        </motion.div>
      ))}
    </div>
  );
}
