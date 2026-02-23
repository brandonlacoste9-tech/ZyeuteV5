import React, { useEffect, useState } from "react";
import { cn } from "../../lib/utils";
import { Link } from "react-router-dom";
import { Post } from "@/types";

/**
 * 🦫 LES CHOIX DU GRAND CASTOR
 * Composant de luxe affichant les vidéos promues par Ti-Guy.
 * Esthétique Souverain : Cuir, Or, Bordures Impériales.
 */

const ChoixDuGrandCastor: React.FC = () => {
    const [choix, setChoix] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/publications/choix-du-castor")
            .then((res) => res.json())
            .then((data) => {
                setChoix(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Erreur Castor:", err);
                setLoading(false);
            });
    }, []);

    if (loading || choix.length === 0) return null;

    return (
        <div className="w-full py-8 px-4 flex flex-col items-center">
            {/* Entête Impériale */}
            <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-gold-500 uppercase tracking-[4px] embossed flex items-center justify-center gap-2">
                    <span>⚜️</span> LES CHOIX DU GRAND CASTOR <span>⚜️</span>
                </h2>
                <p className="text-xs text-gold-300 opacity-70 italic mt-1">
                    La crème de la crème, sélectionnée par l'IA Souveraine.
                </p>
            </div>

            {/* Grille Souveraine */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
                {choix.map((post) => (
                    <Link
                        key={post.id}
                        to={`/post/${post.id}`}
                        className={cn(
                            "leather-card-elevated stitched rounded-2xl aspect-[9/16] overflow-hidden group",
                            "border-2 border-gold-600/30 hover:border-gold-500 transition-all duration-500",
                            "shadow-[0_0_20px_rgba(0,0,0,0.8)] hover:shadow-[0_0_40px_rgba(212,175,55,0.3)]",
                            "relative"
                        )}
                    >
                        {/* Overlay Gradient Or au survol */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gold-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />

                        {/* Thumbnail */}
                        <img
                            src={post.thumbnailUrl || "/assets/placeholder-video.jpg"}
                            alt={post.titre || "Vidéo Souveraine"}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />

                        {/* Badges de Pouvoir */}
                        <div className="absolute top-4 right-4 z-20">
                            <div className="bg-gold-600 text-black text-[10px] font-bold px-2 py-1 rounded-md shadow-lg flex items-center gap-1">
                                🔥 {post.scoreMomentum?.toLocaleString() || "10,000+"}
                            </div>
                        </div>

                        {/* Infos du Citoyen */}
                        <div className="absolute bottom-6 left-6 right-6 z-20 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                            <h3 className="text-gold-200 font-bold text-lg drop-shadow-lg truncate">
                                {post.titre || "Haut Fait Québécois"}
                            </h3>
                            <p className="text-gold-400/80 text-xs font-medium">
                                par {post.user?.username || "Un Citoyen"}
                            </p>
                        </div>

                        {/* Textures Micro-détails (Cuir) */}
                        <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-30 leather-dark" />
                    </Link>
                ))}
            </div>

            {/* Ligne de séparation Or */}
            <div className="w-1/3 h-[1px] bg-gradient-to-r from-transparent via-gold-500/50 to-transparent mt-10" />
        </div>
    );
};

export default ChoixDuGrandCastor;
