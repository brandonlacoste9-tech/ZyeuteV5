import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const ZeroGravityHUD = ({ className }: { className?: string }) => {
    const { user, isGuest } = useAuth();
    const [animate, setAnimate] = useState(false);
    // Use ref to track previous points and trigger animation only on change
    const prevPoints = React.useRef(user?.nectar_points || 0);

    useEffect(() => {
        if (user?.nectar_points !== undefined && user.nectar_points !== prevPoints.current) {
            setAnimate(true);
            setTimeout(() => setAnimate(false), 500);
            prevPoints.current = user.nectar_points;
        }
    }, [user?.nectar_points]);

    // If user object changes (e.g. enhanced), update.

    if (isGuest || !user) return null;

    return (
        <div className={cn("absolute top-4 right-4 z-40 pointer-events-none", className)}>
            <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full select-none",
                "bg-black/30 backdrop-blur-md border border-white/10 shadow-lg",
                "transition-all duration-300 ease-out",
                animate ? "scale-110 border-purple-400/50 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.4)]" : "scale-100"
            )}>
                <span className="text-xl filter drop-shadow-[0_0_5px_rgba(168,85,247,0.6)] animate-pulse">🪐</span>
                <div className="flex flex-col items-end leading-none">
                    <span className="text-[9px] text-purple-200/80 font-bold uppercase tracking-widest mb-0.5">Zero G</span>
                    <span className={cn(
                        "text-sm font-bold font-mono transition-colors",
                        animate ? "text-purple-300" : "text-white"
                    )}>
                        {(user?.nectar_points || 0).toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
    );
};
