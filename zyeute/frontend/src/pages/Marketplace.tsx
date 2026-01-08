/**
 * Marketplace - Premium Quebec Heritage Design
 * Buy & Sell Quebec Products with stitched leather cards
 */

import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import { Button } from "../components/Button";
import { purchaseProduct } from "../services/stripeService";
import { supabase } from "../lib/supabase";
import { toast } from "../components/Toast";
import { formatNumber } from "../lib/utils";
import { logger } from "../lib/logger";

const marketplaceLogger = logger.withContext("Marketplace");

interface Product {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  image_urls: string[];
  category: string;
  is_sold: boolean;
  created_at: string;
  seller?: any;
}

export default function Marketplace() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { id: "all", name: "Tout", icon: "🛍️" },
    { id: "merch", name: "Merch", icon: "👕" },
    { id: "tickets", name: "Billets", icon: "🎫" },
    { id: "art", name: "Art", icon: "🎨" },
    { id: "food", name: "Bouffe", icon: "🍟" },
    { id: "crafts", name: "Artisanat", icon: "🪵" },
    { id: "other", name: "Autre", icon: "📦" },
  ];

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("products")
        .select("*, seller:users(*)")
        .eq("is_sold", false)
        .order("created_at", { ascending: false });

      if (selectedCategory !== "all") {
        query = query.eq("category", selectedCategory);
      }

      if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      marketplaceLogger.error("Error loading products:", error);
      toast.error("Erreur de chargement");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handlePurchase = async (product: Product) => {
    try {
      await purchaseProduct(product.id, product.price);
      toast.success("Achat en cours! 🎉");
      loadProducts();
    } catch (error: any) {
      marketplaceLogger.error("Purchase error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-black leather-overlay pb-20">
      {/* Premium Header */}
      <div className="sticky top-0 z-30 nav-leather border-b-2 border-leather-700/50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-gold-500 embossed tracking-tight">
              Zyeuté Commerce
            </h1>
            <Link to="/marketplace/sell">
              <button className="btn-gold px-4 py-2 rounded-xl font-semibold text-sm">
                + Vendre
              </button>
            </Link>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Recherche des produits québécois..."
              className="input-premium pl-12"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <h2 className="text-gold-400 font-bold mb-3 embossed flex items-center gap-2">
            <span>🏷️</span>
            <span>Catégories</span>
          </h2>
          <div className="flex gap-2 overflow-x-auto gold-scrollbar pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  selectedCategory === cat.id ? "btn-gold" : "btn-leather"
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-leather-300">Chargement des produits...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="leather-card rounded-2xl p-12 text-center stitched">
            <div className="text-6xl mb-4">🛍️</div>
            <h3 className="text-xl font-bold text-gold-500 mb-2">
              Aucun produit trouvé
            </h3>
            <p className="text-leather-300 mb-6">
              Sois le premier à vendre dans cette catégorie!
            </p>
            <Link to="/marketplace/sell">
              <button className="btn-gold px-8 py-3 rounded-xl">
                Vendre un produit
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="leather-card rounded-2xl overflow-hidden stitched hover:scale-105 transition-transform group"
              >
                {/* Product Image */}
                <div className="relative aspect-square bg-leather-900">
                  <img
                    src={product.image_urls[0] || "/placeholder-product.jpg"}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Gold corner accent */}
                  <div
                    className="absolute top-0 right-0 w-12 h-12 bg-gold-gradient opacity-30"
                    style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
                  />

                  {/* Category Badge */}
                  <div className="absolute top-2 left-2 badge-premium text-xs">
                    {categories.find((c) => c.id === product.category)?.icon}{" "}
                    {product.category}
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-white font-bold text-lg line-clamp-2 mb-1">
                      {product.title}
                    </h3>
                    <p className="text-leather-300 text-sm line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  {/* Seller */}
                  {product.seller && (
                    <Link
                      to={`/profile/${product.seller.username}`}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                      <div className="w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center text-xs font-bold">
                        {product.seller.username?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-leather-200 text-sm">
                        @{product.seller.username}
                      </span>
                    </Link>
                  )}

                  {/* Price & Buy Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-leather-700/50">
                    <div>
                      <div className="text-2xl font-black text-gold-400 embossed">
                        ${product.price}
                      </div>
                      <div className="text-leather-400 text-xs">CAD</div>
                    </div>
                    <button
                      onClick={() => handlePurchase(product)}
                      className="btn-gold px-4 py-2 rounded-xl font-semibold text-sm"
                    >
                      Acheter
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Banner */}
        <div className="leather-card rounded-2xl p-6 mt-8 stitched">
          <h3 className="text-gold-400 font-bold mb-3 embossed flex items-center gap-2">
            <span>💡</span>
            <span>Pourquoi acheter sur Zyeuté Commerce?</span>
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex gap-3">
              <span className="text-gold-500 text-xl">🇨🇦</span>
              <div>
                <h4 className="text-white font-semibold mb-1">
                  100% Québécois
                </h4>
                <p className="text-leather-300">
                  Supporte les créateurs locaux
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-gold-500 text-xl">🔒</span>
              <div>
                <h4 className="text-white font-semibold mb-1">
                  Paiements sécurisés
                </h4>
                <p className="text-leather-300">Protégé par Stripe</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-gold-500 text-xl">⚡</span>
              <div>
                <h4 className="text-white font-semibold mb-1">
                  Livraison rapide
                </h4>
                <p className="text-leather-300">Direct du vendeur</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quebec Pride Footer */}
      <div className="text-center py-8 text-leather-400 text-sm">
        <p className="flex items-center justify-center gap-2">
          <span className="text-gold-500">⚜️</span>
          <span>Achète québécois, supporte local</span>
          <span className="text-gold-500">🇨🇦</span>
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
