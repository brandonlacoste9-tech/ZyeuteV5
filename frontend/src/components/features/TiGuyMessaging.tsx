/**
 * Ti-Guy Messaging — Full Screen Voyageur Edition
 * Stitched leather brown, gold accents, beaver mascot, mail envelope tab
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useHive } from "@/contexts/HiveContext";
import { apiCall } from "@/services/api";
import { supabase } from "@/lib/supabase";
import { Avatar } from "@/components/Avatar";

// ─── Design tokens ────────────────────────────────────────────────────────────
const GOLD = "#D4AF37";
const GOLD_LIGHT = "#F4E2A6";
const GOLD_DIM = "#A07820";
const LEATHER_DARKEST = "#0F0804";
const LEATHER_DARK = "#1A0F0A";
const LEATHER_MID = "#2C1810";
const LEATHER_WARM = "#3D2418";
const LEATHER_LIGHT = "#5C3520";
const LEATHER_TAN = "#7A4A2A";
const BUBBLE_USER = "#4A2C1A";
const BUBBLE_TG =
  "linear-gradient(135deg, #5B3A8A 0%, #7B4E9A 50%, #943D6A 100%)";

// ─── Types ───────────────────────────────────────────────────────────────────
type Tab = "tiguy" | "inbox" | "thread";

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  lastMessage?: { content: string; createdAt: string };
  unreadCount: number;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
}

interface ChatMsg {
  id: string;
  from: "user" | "tiguy";
  text: string;
}

export interface TiGuyMessagingProps {
  open: boolean;
  onClose: () => void;
}

// ─── Stitch border CSS injected once ─────────────────────────────────────────
const STITCH_STYLE = `
.tg-panel-header {
  position: relative;
}
/* Outer gold frame */
.tg-panel-header::before {
  content: '';
  position: absolute;
  inset: 8px;
  border-radius: 12px;
  border: 2px solid rgba(212,175,55,0.55);
  pointer-events: none;
  z-index: 1;
}
/* Inner dashed stitch */
.tg-panel-header::after {
  content: '';
  position: absolute;
  inset: 13px;
  border-radius: 9px;
  border: 1.5px dashed rgba(212,175,55,0.30);
  pointer-events: none;
  z-index: 1;
}
`;

// ─── SVG icons ───────────────────────────────────────────────────────────────
function FleurDeLysLarge({ size = 72, gold }: { size?: number; gold: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 130" fill="none">
      <defs>
        <linearGradient id="fg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F4E2A6" />
          <stop offset="45%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#8B6914" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#glow)">
        {/* Center top petal */}
        <path
          d="M50 45 C43 33 39 18 50 6 C61 18 57 33 50 45Z"
          fill="url(#fg)"
        />
        {/* Left petal */}
        <path
          d="M50 65 C36 60 20 55 14 44 C25 36 40 46 50 60Z"
          fill="url(#fg)"
        />
        {/* Right petal */}
        <path
          d="M50 65 C64 60 80 55 86 44 C75 36 60 46 50 60Z"
          fill="url(#fg)"
        />
        {/* Left inner curl */}
        <path
          d="M50 60 C43 54 32 53 28 57 C33 64 45 63 50 60Z"
          fill="url(#fg)"
          opacity="0.75"
        />
        {/* Right inner curl */}
        <path
          d="M50 60 C57 54 68 53 72 57 C67 64 55 63 50 60Z"
          fill="url(#fg)"
          opacity="0.75"
        />
        {/* Cross bar */}
        <rect x="36" y="64" width="28" height="6" rx="3" fill="url(#fg)" />
        {/* Stem */}
        <path d="M46 70 L50 122 L54 70Z" fill="url(#fg)" />
        {/* Base foot */}
        <rect x="38" y="118" width="24" height="5" rx="2.5" fill="url(#fg)" />
        {/* Crown dot */}
        <circle cx="50" cy="4" r="2.5" fill={gold} />
      </g>
    </svg>
  );
}

// ─── Fleur-de-lis icon ────────────────────────────────────────────────────
function FleurIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 22V11l-3 2 1-4 2-4 2 4 1 4-3-2v11z" />
      <path d="M12 7c-1.5 0-2.5-1.5-2-3 .5-1.5 2-2 2-2s1.5.5 2 2c.5 1.5-.5 3-2 3z" />
    </svg>
  );
}

// ─── Envelope icon ─────────────────────────────────────────────────────────
function EnvelopeIcon({ size = 26, gold }: { size?: number; gold: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect
        x="2"
        y="4"
        width="20"
        height="16"
        rx="3"
        fill={gold}
        opacity="0.15"
        stroke={gold}
        strokeWidth="1.5"
      />
      <path
        d="M2 7l10 7 10-7"
        stroke={gold}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="5" cy="6" r="0.8" fill={gold} opacity="0.6" />
      <circle cx="7" cy="6" r="0.8" fill={gold} opacity="0.6" />
      <circle cx="9" cy="6" r="0.8" fill={gold} opacity="0.6" />
      <circle cx="15" cy="6" r="0.8" fill={gold} opacity="0.6" />
      <circle cx="17" cy="6" r="0.8" fill={gold} opacity="0.6" />
      <circle cx="19" cy="6" r="0.8" fill={gold} opacity="0.6" />
    </svg>
  );
}

// ─── Onça-Pintada — Brazil jaguar mascot ────────────────────────────────────
function OncaPintada({
  size = 72,
  gold: _gold,
}: {
  size?: number;
  gold: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <defs>
        <linearGradient id="oc_gold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F4E2A6" />
          <stop offset="40%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#7A5200" />
        </linearGradient>
        <linearGradient id="oc_fur" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F0C060" />
          <stop offset="60%" stopColor="#D4882A" />
          <stop offset="100%" stopColor="#A05010" />
        </linearGradient>
        <linearGradient id="oc_green" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3A9A3A" />
          <stop offset="100%" stopColor="#1A5A1A" />
        </linearGradient>
        <filter id="jglow" x="-15%" y="-15%" width="130%" height="130%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#jglow)">
        {/* Branch / perch */}
        <path
          d="M10 95 Q60 88 110 95"
          stroke="url(#oc_gold)"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Tail curving right */}
        <path
          d="M88 90 Q105 75 108 55 Q110 40 100 35"
          stroke="url(#oc_fur)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        {/* Body */}
        <ellipse cx="60" cy="78" rx="30" ry="18" fill="url(#oc_fur)" />
        {/* Chest white/cream patch */}
        <ellipse cx="60" cy="82" rx="16" ry="10" fill="#F8EDD0" opacity="0.7" />
        {/* Front legs */}
        <rect x="42" y="88" width="8" height="12" rx="4" fill="url(#oc_fur)" />
        <rect x="68" y="88" width="8" height="12" rx="4" fill="url(#oc_fur)" />
        {/* Paws */}
        <ellipse cx="46" cy="100" rx="6" ry="4" fill="#C07020" />
        <ellipse cx="72" cy="100" rx="6" ry="4" fill="#C07020" />
        {/* Neck */}
        <ellipse cx="60" cy="62" rx="14" ry="10" fill="url(#oc_fur)" />
        {/* Head */}
        <ellipse cx="60" cy="46" rx="20" ry="17" fill="url(#oc_fur)" />
        {/* Forehead white */}
        <ellipse cx="60" cy="41" rx="11" ry="8" fill="#F8EDD0" opacity="0.5" />
        {/* Ears */}
        <path d="M42 34 L37 22 L50 30Z" fill="url(#oc_fur)" />
        <path d="M78 34 L83 22 L70 30Z" fill="url(#oc_fur)" />
        {/* Ear inner */}
        <path d="M44 33 L40 25 L50 30Z" fill="#E08030" opacity="0.6" />
        <path d="M76 33 L80 25 L70 30Z" fill="#E08030" opacity="0.6" />
        {/* Eyes — amber with dark pupil */}
        <ellipse cx="52" cy="44" rx="5" ry="4.5" fill="#F0A020" />
        <ellipse cx="68" cy="44" rx="5" ry="4.5" fill="#F0A020" />
        <ellipse cx="52" cy="44" rx="2.5" ry="3" fill="#1A0800" />
        <ellipse cx="68" cy="44" rx="2.5" ry="3" fill="#1A0800" />
        {/* Eye shine */}
        <circle cx="53.5" cy="43" r="1" fill="white" opacity="0.8" />
        <circle cx="69.5" cy="43" r="1" fill="white" opacity="0.8" />
        {/* Nose */}
        <path d="M57 52 Q60 55 63 52 Q60 58 57 52Z" fill="#8B3A1A" />
        {/* Mouth */}
        <path
          d="M55 55 Q60 59 65 55"
          stroke="#5A2010"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Whiskers */}
        <line
          x1="38"
          y1="51"
          x2="55"
          y2="53"
          stroke="#F8EDD0"
          strokeWidth="1"
          opacity="0.8"
        />
        <line
          x1="38"
          y1="54"
          x2="55"
          y2="55"
          stroke="#F8EDD0"
          strokeWidth="1"
          opacity="0.6"
        />
        <line
          x1="65"
          y1="53"
          x2="82"
          y2="51"
          stroke="#F8EDD0"
          strokeWidth="1"
          opacity="0.8"
        />
        <line
          x1="65"
          y1="55"
          x2="82"
          y2="54"
          stroke="#F8EDD0"
          strokeWidth="1"
          opacity="0.6"
        />
        {/* Rosette spots on body */}
        <circle cx="52" cy="74" r="4" fill="#7A3800" opacity="0.5" />
        <circle cx="52" cy="74" r="2" fill="#F0C060" opacity="0.4" />
        <circle cx="68" cy="74" r="4" fill="#7A3800" opacity="0.5" />
        <circle cx="68" cy="74" r="2" fill="#F0C060" opacity="0.4" />
        <circle cx="60" cy="70" r="3.5" fill="#7A3800" opacity="0.4" />
        {/* Gold crown */}
        <path
          d="M46 30 L50 20 L55 28 L60 16 L65 28 L70 20 L74 30Z"
          fill="url(#oc_gold)"
        />
        {/* Crown gems */}
        <circle cx="60" cy="19" r="3" fill="#2A6A2A" />
        <circle cx="51" cy="22" r="2" fill="#D4AF37" />
        <circle cx="69" cy="22" r="2" fill="#D4AF37" />
        {/* Brazil flag colors — green/yellow ribbon at base */}
        <rect
          x="20"
          y="104"
          width="80"
          height="5"
          rx="2.5"
          fill="url(#oc_green)"
        />
        <rect x="30" y="109" width="60" height="4" rx="2" fill="#F0C020" />
      </g>
    </svg>
  );
}

// ─── Puma — Argentina mascot ─────────────────────────────────────────────────
function Puma({ size = 72, gold: _gold }: { size?: number; gold: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <defs>
        <linearGradient id="pu_gold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F4E2A6" />
          <stop offset="40%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#7A5200" />
        </linearGradient>
        <linearGradient id="pu_fur" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4A060" />
          <stop offset="50%" stopColor="#A06830" />
          <stop offset="100%" stopColor="#703010" />
        </linearGradient>
        <linearGradient id="pu_sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#74ACDF" />
          <stop offset="100%" stopColor="#4A8AC0" />
        </linearGradient>
        <filter id="puglow" x="-15%" y="-15%" width="130%" height="130%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#puglow)">
        {/* Argentina flag stripe at base */}
        <rect
          x="10"
          y="106"
          width="100"
          height="5"
          rx="2"
          fill="url(#pu_sky)"
        />
        <rect
          x="10"
          y="111"
          width="100"
          height="4"
          rx="2"
          fill="white"
          opacity="0.9"
        />
        <rect
          x="10"
          y="115"
          width="100"
          height="5"
          rx="2"
          fill="url(#pu_sky)"
        />
        {/* Body — sleek crouching puma */}
        <ellipse cx="62" cy="80" rx="32" ry="17" fill="url(#pu_fur)" />
        {/* Belly lighter patch */}
        <ellipse cx="62" cy="84" rx="18" ry="9" fill="#E8C090" opacity="0.6" />
        {/* Hind haunch */}
        <ellipse cx="85" cy="76" rx="14" ry="12" fill="#A06830" />
        {/* Front legs */}
        <rect x="42" y="88" width="9" height="14" rx="4" fill="url(#pu_fur)" />
        <rect x="56" y="90" width="9" height="12" rx="4" fill="url(#pu_fur)" />
        {/* Paws */}
        <ellipse cx="46.5" cy="102" rx="6" ry="3.5" fill="#703010" />
        <ellipse cx="60.5" cy="102" rx="6" ry="3.5" fill="#703010" />
        {/* Tail — long, curving up */}
        <path
          d="M90 78 Q108 65 112 45 Q114 30 106 25"
          stroke="url(#pu_fur)"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M106 25 Q102 18 108 15"
          stroke="#A06830"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Neck */}
        <ellipse cx="48" cy="66" rx="13" ry="11" fill="url(#pu_fur)" />
        {/* Head */}
        <ellipse cx="40" cy="50" rx="20" ry="17" fill="url(#pu_fur)" />
        {/* Muzzle */}
        <ellipse cx="32" cy="55" rx="10" ry="7" fill="#C08040" />
        {/* Forehead lighter */}
        <ellipse cx="42" cy="44" rx="10" ry="7" fill="#D4A060" opacity="0.5" />
        {/* Ears — pointed */}
        <path d="M28 38 L22 24 L36 34Z" fill="url(#pu_fur)" />
        <path d="M52 36 L56 22 L44 32Z" fill="url(#pu_fur)" />
        {/* Ear inner */}
        <path d="M30 37 L26 27 L36 33Z" fill="#C07030" opacity="0.7" />
        <path d="M50 35 L53 25 L44 31Z" fill="#C07030" opacity="0.7" />
        {/* Eyes — intense amber-green */}
        <ellipse cx="34" cy="48" rx="5" ry="4" fill="#80C040" />
        <ellipse cx="48" cy="46" rx="5" ry="4" fill="#80C040" />
        <ellipse cx="34" cy="48" rx="2.5" ry="3" fill="#0A0600" />
        <ellipse cx="48" cy="46" rx="2.5" ry="3" fill="#0A0600" />
        {/* Eye shine */}
        <circle cx="35.5" cy="47" r="1" fill="white" opacity="0.9" />
        <circle cx="49.5" cy="45" r="1" fill="white" opacity="0.9" />
        {/* Nose */}
        <path d="M29 56 Q32 59 35 56 Q32 62 29 56Z" fill="#5A1A0A" />
        {/* Mouth */}
        <path
          d="M27 58 Q32 63 37 58"
          stroke="#3A0A00"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Whiskers */}
        <line
          x1="14"
          y1="54"
          x2="28"
          y2="56"
          stroke="#F8EDD0"
          strokeWidth="1"
          opacity="0.8"
        />
        <line
          x1="14"
          y1="57"
          x2="28"
          y2="57"
          stroke="#F8EDD0"
          strokeWidth="1"
          opacity="0.6"
        />
        <line
          x1="36"
          y1="56"
          x2="50"
          y2="54"
          stroke="#F8EDD0"
          strokeWidth="1"
          opacity="0.8"
        />
        <line
          x1="36"
          y1="57"
          x2="50"
          y2="57"
          stroke="#F8EDD0"
          strokeWidth="1"
          opacity="0.6"
        />
        {/* Gold crown */}
        <path
          d="M26 34 L30 23 L35 31 L40 19 L45 31 L50 23 L54 34Z"
          fill="url(#pu_gold)"
        />
        {/* Crown gems — light blue (Argentina) */}
        <circle cx="40" cy="22" r="3" fill="#74ACDF" />
        <circle cx="31" cy="25" r="2" fill="#D4AF37" />
        <circle cx="49" cy="25" r="2" fill="#D4AF37" />
      </g>
    </svg>
  );
}

// ─── Águila Real — Mexico coat of arms mascot ────────────────────────────────
function AguilaReal({
  size = 72,
  gold: _gold,
}: {
  size?: number;
  gold: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 130" fill="none">
      <defs>
        <linearGradient id="ag_gold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F4E2A6" />
          <stop offset="40%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#7A5200" />
        </linearGradient>
        <linearGradient id="ag_brown" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C8861A" />
          <stop offset="100%" stopColor="#5C3000" />
        </linearGradient>
        <linearGradient id="ag_cactus" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2A7A5A" />
          <stop offset="100%" stopColor="#1A5A3A" />
        </linearGradient>
        <filter id="eglow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#eglow)">
        {/* ── Nopal cactus base ── */}
        {/* Center pad */}
        <ellipse cx="60" cy="98" rx="12" ry="9" fill="url(#ag_cactus)" />
        {/* Left pad */}
        <ellipse
          cx="44"
          cy="100"
          rx="9"
          ry="7"
          fill="url(#ag_cactus)"
          transform="rotate(-15 44 100)"
        />
        {/* Right pad */}
        <ellipse
          cx="76"
          cy="100"
          rx="9"
          ry="7"
          fill="url(#ag_cactus)"
          transform="rotate(15 76 100)"
        />
        {/* Far left pad */}
        <ellipse
          cx="32"
          cy="105"
          rx="7"
          ry="5.5"
          fill="url(#ag_cactus)"
          transform="rotate(-25 32 105)"
        />
        {/* Far right pad */}
        <ellipse
          cx="88"
          cy="105"
          rx="7"
          ry="5.5"
          fill="url(#ag_cactus)"
          transform="rotate(25 88 105)"
        />
        {/* Cactus spines */}
        <line
          x1="60"
          y1="92"
          x2="58"
          y2="88"
          stroke="#1A5A3A"
          strokeWidth="0.8"
        />
        <line
          x1="64"
          y1="91"
          x2="66"
          y2="87"
          stroke="#1A5A3A"
          strokeWidth="0.8"
        />
        <line
          x1="56"
          y1="94"
          x2="53"
          y2="91"
          stroke="#1A5A3A"
          strokeWidth="0.8"
        />
        {/* Cactus fruits (tunas) — pink/red */}
        <ellipse cx="52" cy="94" rx="3" ry="4" fill="#C8385A" />
        <ellipse cx="68" cy="93" rx="3" ry="4" fill="#C8385A" />
        <ellipse cx="38" cy="98" rx="2.5" ry="3.5" fill="#C8385A" />
        <ellipse cx="83" cy="98" rx="2.5" ry="3.5" fill="#C8385A" />
        {/* Fruit dots */}
        <circle cx="52" cy="93" r="0.8" fill="#FF6688" />
        <circle cx="68" cy="92" r="0.8" fill="#FF6688" />

        {/* Rock / stone base */}
        <path
          d="M48 107 C44 110 44 115 60 116 C76 115 76 110 72 107Z"
          fill="url(#ag_gold)"
          opacity="0.8"
        />

        {/* ── Eagle body ── */}
        {/* Main body */}
        <ellipse cx="63" cy="72" rx="13" ry="17" fill="url(#ag_brown)" />

        {/* Left wing — spread upward and left */}
        <path
          d="M52 65 C44 56 28 46 10 42 C12 52 22 60 36 65 C24 66 12 68 6 76 C18 80 32 74 44 69 C34 76 26 86 26 95 C36 88 46 76 52 68Z"
          fill="url(#ag_brown)"
        />
        {/* Left wing highlight */}
        <path
          d="M50 63 C40 55 24 48 12 46 C16 54 26 60 38 64"
          stroke="#C8861A"
          strokeWidth="1.2"
          fill="none"
          opacity="0.6"
        />
        <path
          d="M48 70 C36 68 22 70 10 76"
          stroke="#C8861A"
          strokeWidth="1"
          fill="none"
          opacity="0.5"
        />
        {/* Left primary feather tips */}
        <path
          d="M26 95 C22 101 20 107 23 107"
          stroke="url(#ag_gold)"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M32 97 C28 103 27 109 30 108"
          stroke="url(#ag_gold)"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M20 90 C15 96 14 102 17 102"
          stroke="url(#ag_gold)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Right wing — spread upward and right */}
        <path
          d="M74 65 C82 56 98 46 116 42 C114 52 104 60 90 65 C102 66 114 68 120 76 C108 80 94 74 82 69 C92 76 100 86 100 95 C90 88 80 76 74 68Z"
          fill="url(#ag_brown)"
        />
        {/* Right wing highlight */}
        <path
          d="M76 63 C86 55 102 48 114 46 C110 54 100 60 88 64"
          stroke="#C8861A"
          strokeWidth="1.2"
          fill="none"
          opacity="0.6"
        />
        {/* Right primary feather tips */}
        <path
          d="M100 95 C104 101 106 107 103 107"
          stroke="url(#ag_gold)"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M94 97 C98 103 99 109 96 108"
          stroke="url(#ag_gold)"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M106 90 C111 96 112 102 109 102"
          stroke="url(#ag_gold)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* ── Head — turned LEFT (heraldic, coat of arms style) ── */}
        {/* Neck */}
        <path
          d="M56 57 C56 52 72 52 70 57 L68 64 L58 64Z"
          fill="url(#ag_brown)"
        />
        {/* Head */}
        <ellipse cx="56" cy="48" rx="11" ry="10" fill="url(#ag_brown)" />
        {/* Crest feathers */}
        <path d="M50 40 C46 31 51 26 54 33Z" fill="url(#ag_gold)" />
        <path d="M55 39 C53 30 58 25 60 32Z" fill="url(#ag_gold)" />
        <path d="M60 40 C59 31 64 27 64 34Z" fill="url(#ag_gold)" />
        {/* White head patch */}
        <ellipse cx="52" cy="47" rx="5" ry="5" fill="#E8D090" opacity="0.5" />

        {/* Beak — turned left, open (holding serpent) */}
        <path
          d="M46 46 C40 44 36 47 38 51 C41 50 45 49 47 47Z"
          fill="url(#ag_gold)"
        />
        {/* Lower beak */}
        <path
          d="M46 47 C41 48 38 51 40 54 C43 53 46 51 47 49Z"
          fill="#C8A020"
        />
        {/* Beak hook */}
        <path d="M36 51 C33 54 35 57 38 55Z" fill="#A07010" />

        {/* Eye */}
        <circle cx="52" cy="45" r="3" fill="#1A0A00" />
        <circle cx="51" cy="44" r="1" fill="#FF6600" opacity="0.9" />
        <circle cx="50.5" cy="43.5" r="0.5" fill="#FFD700" />

        {/* ── Serpent — in beak, coiling ── */}
        <path
          d="M38 51 C30 48 24 42 26 36 C28 30 34 30 36 36 C32 38 30 44 34 46 C38 44 40 38 36 34"
          stroke="#6A9A40"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M38 51 C30 48 24 42 26 36 C28 30 34 30 36 36 C32 38 30 44 34 46"
          stroke="#8ABB50"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        {/* Serpent head / tongue */}
        <path
          d="M26 36 C23 32 22 29 24 28"
          stroke="#6A9A40"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M24 28 C22 25 20 24 19 26"
          stroke="#FF4444"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M24 28 C23 25 22 23 23 22"
          stroke="#FF4444"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* ── Talons gripping cactus ── */}
        <path
          d="M56 88 C52 90 50 92 52 94"
          stroke="url(#ag_gold)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M58 89 C55 92 54 95 56 96"
          stroke="url(#ag_gold)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M62 89 C60 93 60 96 62 97"
          stroke="url(#ag_gold)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M66 88 C68 91 68 94 66 95"
          stroke="url(#ag_gold)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M70 87 C73 90 73 93 71 94"
          stroke="url(#ag_gold)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* ── Laurel & oak wreath hints (bottom) ── */}
        <path
          d="M30 112 C24 108 20 112 22 116 C26 116 30 114 32 112Z"
          fill="#4A7A30"
          opacity="0.8"
        />
        <path
          d="M24 116 C18 114 16 118 19 120 C22 120 25 118 26 116Z"
          fill="#4A7A30"
          opacity="0.8"
        />
        <path
          d="M90 112 C96 108 100 112 98 116 C94 116 90 114 88 112Z"
          fill="#4A7A30"
          opacity="0.8"
        />
        <path
          d="M96 116 C102 114 104 118 101 120 C98 120 95 118 94 116Z"
          fill="#4A7A30"
          opacity="0.8"
        />
        {/* Wreath ribbon */}
        <path
          d="M50 122 C55 124 65 124 70 122"
          stroke="#C8861A"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const TiGuyMessaging: React.FC<TiGuyMessagingProps> = ({
  open,
  onClose,
}) => {
  const { edgeLighting } = useTheme();
  const gold = edgeLighting || GOLD;
  const { currentHive, switchHive } = useHive();
  const isMexicoHive = currentHive.id === "mexico";
  const isBrazilHive = currentHive.id === "brazil";
  const isArgentinaHive = currentHive.id === "argentina";

  const [tab, setTab] = useState<Tab>("tiguy");

  // Ti-Guy chat state
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Inbox state
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [convosLoading, setConvosLoading] = useState(false);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [dmMsgs, setDmMsgs] = useState<Message[]>([]);
  const [dmInput, setDmInput] = useState("");
  const [dmSending, setDmSending] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<
    Conversation["otherUser"][]
  >([]);
  const [searching, setSearching] = useState(false);
  const dmBottomRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // User info
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | undefined>();

  const totalUnread = convos.reduce((s, c) => s + (c.unreadCount || 0), 0);

  // Load user
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      setUserId(session.user.id);
      supabase
        .from("user_profiles")
        .select("username")
        .eq("id", session.user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.username) setUsername(data.username);
        });
    });
  }, []);

  // Reset on open
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      setTab("tiguy");
      setChatMsgs([]);
      setActiveConvo(null);
      setDmMsgs([]);
      fetchConvos();
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Cleanup realtime on close
  useEffect(() => {
    if (!open) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current);
        realtimeRef.current = null;
      }
    }
  }, [open]);

  // Scroll to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs]);
  useEffect(() => {
    dmBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dmMsgs]);

  // ── Fetch convos ────────────────────────────────────────────────────────────
  const fetchConvos = useCallback(async () => {
    setConvosLoading(true);
    const { data } = await apiCall<{ conversations: Conversation[] }>(
      "/messaging/conversations",
    );
    setConvos(data?.conversations ?? []);
    setConvosLoading(false);
  }, []);

  // ── Ti-Guy send ─────────────────────────────────────────────────────────────
  const sendToTiGuy = useCallback(async () => {
    if (!chatInput.trim() || chatSending) return;
    const text = chatInput.trim();
    setChatInput("");
    const userMsg: ChatMsg = { id: `u-${Date.now()}`, from: "user", text };
    setChatMsgs((p) => [...p, userMsg]);
    setChatSending(true);
    try {
      const history = chatMsgs.slice(-8).map((m) => ({
        sender: m.from === "user" ? "user" : "tiguy",
        text: m.text,
      }));
      const { data } = await apiCall<{ response: string }>("/tiguy/chat", {
        method: "POST",
        body: JSON.stringify({
          message: text,
          history,
          context: { userId, username, hive: currentHive.id },
        }),
      });
      setChatMsgs((p) => [
        ...p,
        {
          id: `tg-${Date.now()}`,
          from: "tiguy",
          text: data?.response ?? "Osti, réessaye!",
        },
      ]);
    } catch {
      setChatMsgs((p) => [
        ...p,
        {
          id: `tg-err-${Date.now()}`,
          from: "tiguy",
          text: "Câlisse, chu tombé! Réessaye! 🦫",
        },
      ]);
    } finally {
      setChatSending(false);
    }
  }, [chatInput, chatSending, chatMsgs, userId, username, currentHive.id]);

  // ── Open DM thread ──────────────────────────────────────────────────────────
  const openThread = useCallback(
    async (conv: Conversation) => {
      setActiveConvo(conv);
      setTab("thread");
      setDmMsgs([]);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current);
        realtimeRef.current = null;
      }
      const { data } = await apiCall<{ messages: Message[] }>(
        `/messaging/conversations/${conv.id}/messages`,
      );
      setDmMsgs(data?.messages ?? []);
      try {
        const ch = supabase
          .channel(`tg:conv:${conv.id}`)
          .on(
            "postgres_changes" as any,
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `conversation_id=eq.${conv.id}`,
            },
            (payload: any) => {
              const m = payload.new as Message;
              setDmMsgs((p) => (p.some((x) => x.id === m.id) ? p : [...p, m]));
            },
          )
          .subscribe();
        realtimeRef.current = ch;
      } catch {
        /* poll fallback */
      }
      pollRef.current = setInterval(async () => {
        const { data: d } = await apiCall<{ messages: Message[] }>(
          `/messaging/conversations/${conv.id}/messages`,
        );
        if (d?.messages) setDmMsgs(d.messages);
      }, 5000);
      setTimeout(() => fetchConvos(), 500);
    },
    [fetchConvos],
  );

  // ── Send DM ─────────────────────────────────────────────────────────────────
  const sendDM = useCallback(async () => {
    if (!dmInput.trim() || !activeConvo || dmSending) return;
    const content = dmInput.trim();
    setDmInput("");
    setDmSending(true);
    const optId = `opt-${Date.now()}`;
    setDmMsgs((p) => [
      ...p,
      {
        id: optId,
        content,
        senderId: userId ?? "me",
        createdAt: new Date().toISOString(),
      },
    ]);
    const { data, error } = await apiCall<{ message: Message }>(
      `/messaging/conversations/${activeConvo.id}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      },
    );
    setDmSending(false);
    if (error) {
      setDmMsgs((p) => p.filter((m) => m.id !== optId));
      setDmInput(content);
      return;
    }
    if (data?.message) {
      setDmMsgs((p) => p.map((m) => (m.id === optId ? data.message : m)));
      fetchConvos();
    }
  }, [dmInput, activeConvo, dmSending, userId, fetchConvos]);

  // ── User search ─────────────────────────────────────────────────────────────
  const handleSearch = (q: string) => {
    setSearchQ(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      const { data } = await apiCall<{ users: Conversation["otherUser"][] }>(
        `/messaging/users/search?q=${encodeURIComponent(q.trim())}`,
      );
      setSearching(false);
      setSearchResults(data?.users ?? []);
    }, 400);
  };

  const startDM = async (uid: string) => {
    setSearchQ("");
    setSearchResults([]);
    const { data } = await apiCall<{
      conversation?: { id: string };
      conversationId?: string;
    }>("/messaging/conversations/direct", {
      method: "POST",
      body: JSON.stringify({ userId: uid }),
    });
    const cid = data?.conversation?.id ?? data?.conversationId;
    if (!cid) return;
    await fetchConvos();
    setConvos((prev) => {
      const found = prev.find((c) => c.id === cid);
      if (found) openThread(found);
      return prev;
    });
  };

  if (!open) return null;

  // ─── Shared header ──────────────────────────────────────────────────────────
  const renderHeader = () => (
    <div
      className="tg-panel-header flex-shrink-0 relative"
      style={{
        background: `linear-gradient(180deg, ${LEATHER_TAN} 0%, ${LEATHER_LIGHT} 30%, ${LEATHER_WARM} 100%)`,
        borderBottom: `3px solid ${gold}`,
        boxShadow: `0 4px 20px rgba(0,0,0,0.6), inset 0 -2px 0 ${LEATHER_DARKEST}`,
        paddingBottom: 2,
      }}
    >
      {/* Top bar: close + title */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 relative z-10">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl active:scale-90 transition-all"
          style={{
            background: `${LEATHER_DARKEST}80`,
            border: `1px solid ${gold}40`,
          }}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke={gold}
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Center: fleur-de-lis + title */}
        <div className="flex flex-col items-center gap-1">
          {isMexicoHive ? (
            <AguilaReal size={70} gold={gold} />
          ) : isBrazilHive ? (
            <OncaPintada size={70} gold={gold} />
          ) : isArgentinaHive ? (
            <Puma size={70} gold={gold} />
          ) : (
            <FleurDeLysLarge size={70} gold={gold} />
          )}
          <div className="flex flex-col items-center -mt-1">
            <h1
              className="text-2xl font-black leading-none"
              style={{
                color: gold,
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                textShadow: `0 0 20px ${gold}90, 0 0 40px ${gold}40`,
                letterSpacing: "0.08em",
              }}
            >
              {isMexicoHive
                ? "El Güey"
                : isBrazilHive
                  ? "Mano"
                  : isArgentinaHive
                    ? "Pibe"
                    : "Ti-Guy"}
            </h1>
            <p
              className="text-[0.5rem] uppercase tracking-[0.3em] font-bold"
              style={{ color: GOLD_LIGHT }}
            >
              {isMexicoHive
                ? "¡Arriba México! 🇲🇽"
                : isBrazilHive
                  ? "Brasil no coração! 🇧🇷"
                  : isArgentinaHive
                    ? "¡Vamos Argentina! 🇦🇷"
                    : "Antigravity Gold ⚜️"}
            </p>
          </div>
        </div>

        {/* Spacer to balance close button */}
        <div className="w-8" />
      </div>

      {/* Dev hive switcher — only visible to comet_test */}
      {username === "comet_test" && (
        <div
          className="flex items-center justify-center gap-2 px-4 pb-1 relative z-10"
          style={{ opacity: 0.7 }}
        >
          {(["quebec", "mexico", "brazil", "argentina"] as const).map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => {
                switchHive(h);
                localStorage.setItem("zyeute_hive_id", h);
              }}
              title={h}
              style={{
                fontSize: 18,
                background: currentHive.id === h ? `${gold}30` : "transparent",
                border: `1px solid ${currentHive.id === h ? gold : gold + "30"}`,
                borderRadius: 8,
                padding: "2px 6px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {h === "quebec"
                ? "⚜️"
                : h === "mexico"
                  ? "🇲🇽"
                  : h === "brazil"
                    ? "🇧🇷"
                    : "🇦🇷"}
            </button>
          ))}
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex items-center gap-2 px-4 pb-3 relative z-10">
        {/* Ti-Guy tab */}
        <button
          type="button"
          onClick={() => setTab("tiguy")}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all active:scale-95"
          style={{
            background:
              tab === "tiguy"
                ? `linear-gradient(135deg, ${gold}40, ${gold}20)`
                : `${LEATHER_DARKEST}60`,
            border: `1.5px solid ${tab === "tiguy" ? gold : gold + "30"}`,
            boxShadow: tab === "tiguy" ? `0 0 12px ${gold}30` : "none",
          }}
        >
          <span
            style={{ color: tab === "tiguy" ? gold : GOLD_DIM, fontSize: 18 }}
          >
            {isMexicoHive
              ? "🤟"
              : isBrazilHive
                ? "🐆"
                : isArgentinaHive
                  ? "🐆"
                  : "🦫"}
          </span>
          <span
            className="text-xs font-black tracking-wide"
            style={{ color: tab === "tiguy" ? gold : GOLD_DIM }}
          >
            {isMexicoHive
              ? "El Güey"
              : isBrazilHive
                ? "Mano"
                : isArgentinaHive
                  ? "Pibe"
                  : "Ti-Guy"}
          </span>
        </button>

        {/* Inbox tab */}
        <button
          type="button"
          onClick={() => setTab(tab === "thread" ? "thread" : "inbox")}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all active:scale-95 relative"
          style={{
            background:
              tab !== "tiguy"
                ? `linear-gradient(135deg, ${gold}40, ${gold}20)`
                : `${LEATHER_DARKEST}60`,
            border: `1.5px solid ${tab !== "tiguy" ? gold : gold + "30"}`,
            boxShadow: tab !== "tiguy" ? `0 0 12px ${gold}30` : "none",
          }}
        >
          <EnvelopeIcon size={20} gold={tab !== "tiguy" ? gold : GOLD_DIM} />
          <span
            className="text-xs font-black tracking-wide"
            style={{ color: tab !== "tiguy" ? gold : GOLD_DIM }}
          >
            Messages
          </span>
          {totalUnread > 0 && (
            <span
              className="absolute -top-1 -right-1 text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1"
              style={{
                background: gold,
                color: LEATHER_DARKEST,
                boxShadow: `0 0 8px ${gold}80`,
              }}
            >
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </button>
      </div>

      {/* Gold stitching line */}
      <div
        className="absolute bottom-0 left-4 right-4 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${gold}60, transparent)`,
        }}
      />
    </div>
  );

  // ─── Ti-Guy chat content ────────────────────────────────────────────────────
  const renderTiGuy = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{ background: LEATHER_DARK }}
      >
        {chatMsgs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-70">
            {isMexicoHive ? (
              <AguilaReal size={80} gold={gold} />
            ) : isBrazilHive ? (
              <OncaPintada size={80} gold={gold} />
            ) : isArgentinaHive ? (
              <Puma size={80} gold={gold} />
            ) : (
              <FleurDeLysLarge size={80} gold={gold} />
            )}
            <p
              className="text-sm font-semibold text-center"
              style={{ color: GOLD_LIGHT }}
            >
              Allo! Chu Ti-Guy, ton concierge québécois. 🍁{"\n"}Jase avec moi!
            </p>
          </div>
        )}
        {chatMsgs.map((msg) =>
          msg.from === "user" ? (
            <div key={msg.id} className="flex justify-end">
              <div
                className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-sm text-sm"
                style={{
                  background: BUBBLE_USER,
                  border: `1px solid ${gold}40`,
                  color: GOLD_LIGHT,
                }}
              >
                {msg.text}
              </div>
            </div>
          ) : (
            <div key={msg.id} className="flex items-start gap-2">
              <div
                className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border"
                style={{ borderColor: gold, background: LEATHER_MID }}
              >
                <span className="text-xs font-black" style={{ color: gold }}>
                  TG
                </span>
              </div>
              <div
                className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm"
                style={{
                  background: BUBBLE_TG,
                  border: `1px solid ${gold}50`,
                  color: GOLD_LIGHT,
                  boxShadow: `0 0 10px ${gold}20`,
                }}
              >
                {msg.text}
              </div>
            </div>
          ),
        )}
        {chatSending && (
          <div className="flex items-start gap-2">
            <div
              className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border"
              style={{ borderColor: gold, background: LEATHER_MID }}
            >
              <span className="text-xs font-black" style={{ color: gold }}>
                TG
              </span>
            </div>
            <div
              className="px-4 py-2.5 rounded-2xl rounded-bl-sm"
              style={{ background: BUBBLE_TG, border: `1px solid ${gold}50` }}
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: gold, animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Input */}
      <div
        className="flex items-center gap-2 p-3 flex-shrink-0"
        style={{
          background: `linear-gradient(180deg, ${LEATHER_WARM} 0%, ${LEATHER_LIGHT} 100%)`,
          borderTop: `2px solid ${gold}50`,
        }}
      >
        <div
          className="w-10 h-10 rounded flex-shrink-0 flex items-center justify-center"
          style={{
            background: `linear-gradient(145deg, ${GOLD_LIGHT} 0%, ${gold} 50%, #8B6914 100%)`,
            border: `1px solid ${gold}`,
          }}
        >
          <FleurIcon size={18} />
        </div>
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendToTiGuy()}
          placeholder="Jase avec Ti-Guy..."
          className="flex-1 px-4 py-2.5 rounded-lg text-sm focus:outline-none"
          style={{
            background: LEATHER_DARKEST,
            border: `2px solid ${gold}50`,
            color: GOLD_LIGHT,
          }}
        />
        <button
          type="button"
          onClick={sendToTiGuy}
          disabled={!chatInput.trim() || chatSending}
          className="w-10 h-10 rounded flex-shrink-0 flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
          style={{
            background: `linear-gradient(145deg, ${GOLD_LIGHT} 0%, ${gold} 50%, #8B6914 100%)`,
            border: `1px solid ${gold}`,
          }}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );

  // ─── Inbox content ──────────────────────────────────────────────────────────
  const renderInbox = () => (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{ background: LEATHER_DARK }}
    >
      {/* New DM search */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <input
          type="text"
          value={searchQ}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="🔍  Nouveau message — chercher un utilisateur..."
          className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
          style={{
            background: LEATHER_MID,
            border: `1.5px solid ${gold}40`,
            color: GOLD_LIGHT,
          }}
        />
        {searching && (
          <p
            className="text-xs px-1 pt-1 opacity-50"
            style={{ color: GOLD_LIGHT }}
          >
            Recherche...
          </p>
        )}
        {searchResults.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => startDM(u.id)}
            className="w-full flex items-center gap-3 px-2 py-2 mt-1 rounded-xl hover:bg-white/5 transition-all"
          >
            <Avatar
              src={u.avatar_url}
              alt={u.display_name || u.username}
              size="xs"
              userId={u.id}
            />
            <div className="text-left">
              <p className="text-sm font-semibold" style={{ color: gold }}>
                {u.display_name || u.username}
              </p>
              <p className="text-xs opacity-60" style={{ color: GOLD_LIGHT }}>
                @{u.username}
              </p>
            </div>
          </button>
        ))}
        {/* Divider */}
        <div
          className="mt-2 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${gold}40, transparent)`,
          }}
        />
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {convosLoading ? (
          <div className="flex items-center justify-center h-20">
            <div
              className="w-6 h-6 rounded-full border-2 animate-spin"
              style={{
                borderColor: `${gold} transparent transparent transparent`,
              }}
            />
          </div>
        ) : convos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 opacity-60">
            <EnvelopeIcon size={36} gold={gold} />
            <p className="text-xs" style={{ color: GOLD_LIGHT }}>
              Aucune conversation. Démarre un nouveau DM!
            </p>
          </div>
        ) : (
          convos.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => openThread(c)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition-all active:scale-95"
              style={{
                background: c.unreadCount > 0 ? `${gold}12` : "transparent",
                border: `1px solid ${c.unreadCount > 0 ? gold + "40" : "transparent"}`,
              }}
            >
              <Avatar
                src={c.otherUser.avatar_url}
                alt={c.otherUser.display_name || c.otherUser.username}
                size="sm"
                userId={c.otherUser.id}
              />
              <div className="flex-1 min-w-0 text-left">
                <p
                  className="text-sm font-semibold truncate"
                  style={{ color: c.unreadCount > 0 ? GOLD_LIGHT : gold }}
                >
                  {c.otherUser.display_name || c.otherUser.username}
                </p>
                {c.lastMessage && (
                  <p
                    className="text-xs truncate opacity-60"
                    style={{ color: GOLD_LIGHT }}
                  >
                    {c.lastMessage.content}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 flex flex-col items-end gap-1">
                {c.lastMessage && (
                  <span
                    className="text-[10px] opacity-50"
                    style={{ color: GOLD_LIGHT }}
                  >
                    {formatTime(c.lastMessage.createdAt)}
                  </span>
                )}
                {c.unreadCount > 0 && (
                  <span
                    className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                    style={{ background: gold, color: LEATHER_DARKEST }}
                  >
                    {c.unreadCount}
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  // ─── Thread content ─────────────────────────────────────────────────────────
  const renderThread = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Thread header */}
      {activeConvo && (
        <div
          className="flex items-center gap-3 px-3 py-2.5 flex-shrink-0"
          style={{
            background: LEATHER_MID,
            borderBottom: `1px solid ${gold}30`,
          }}
        >
          <button
            type="button"
            onClick={() => setTab("inbox")}
            className="p-1.5 rounded-lg"
            aria-label="Retour"
          >
            <BackIcon gold={gold} />
          </button>
          <Avatar
            src={activeConvo.otherUser.avatar_url}
            alt={
              activeConvo.otherUser.display_name ||
              activeConvo.otherUser.username
            }
            size="xs"
            userId={activeConvo.otherUser.id}
          />
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-bold truncate"
              style={{ color: GOLD_LIGHT }}
            >
              {activeConvo.otherUser.display_name ||
                activeConvo.otherUser.username}
            </p>
            <p className="text-[10px] opacity-60" style={{ color: gold }}>
              @{activeConvo.otherUser.username}
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-3 py-3 space-y-2"
        style={{ background: LEATHER_DARK }}
      >
        {dmMsgs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-24 gap-2 opacity-50">
            <p className="text-xs" style={{ color: GOLD_LIGHT }}>
              Aucun message encore. Dis bonjour!
            </p>
          </div>
        )}
        {dmMsgs.map((msg) => {
          const isMe = msg.senderId === userId;
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className="max-w-[80%] px-3 py-2 rounded-2xl text-sm"
                style={{
                  background: isMe ? BUBBLE_USER : BUBBLE_TG,
                  border: `1px solid ${gold}40`,
                  color: GOLD_LIGHT,
                }}
              >
                <p>{msg.content}</p>
                <p
                  className="text-[10px] mt-0.5 opacity-50 text-right"
                  style={{ color: gold }}
                >
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={dmBottomRef} />
      </div>

      {/* DM Input */}
      <div
        className="flex items-center gap-2 p-3 flex-shrink-0"
        style={{
          background: `linear-gradient(180deg, ${LEATHER_WARM} 0%, ${LEATHER_LIGHT} 100%)`,
          borderTop: `2px solid ${gold}50`,
        }}
      >
        <div
          className="w-10 h-10 rounded flex-shrink-0 flex items-center justify-center"
          style={{
            background: `linear-gradient(145deg, ${GOLD_LIGHT} 0%, ${gold} 50%, #8B6914 100%)`,
            border: `1px solid ${gold}`,
          }}
        >
          <FleurIcon size={18} />
        </div>
        <input
          type="text"
          value={dmInput}
          onChange={(e) => setDmInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendDM()}
          placeholder="Écris un message..."
          className="flex-1 px-4 py-2.5 rounded-lg text-sm focus:outline-none"
          style={{
            background: LEATHER_DARKEST,
            border: `2px solid ${gold}50`,
            color: GOLD_LIGHT,
          }}
        />
        <button
          type="button"
          onClick={sendDM}
          disabled={!dmInput.trim() || dmSending}
          className="w-10 h-10 rounded flex-shrink-0 flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
          style={{
            background: `linear-gradient(145deg, ${GOLD_LIGHT} 0%, ${gold} 50%, #8B6914 100%)`,
            border: `1px solid ${gold}`,
          }}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );

  // ─── Shell ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STITCH_STYLE}</style>
      <div
        className="fixed inset-0 z-[100] flex flex-col"
        style={{ background: "rgba(0,0,0,0.92)" }}
        onClick={onClose}
      >
        <div
          className="flex-1 flex flex-col overflow-hidden"
          style={{
            background: `linear-gradient(180deg, ${LEATHER_WARM} 0%, ${LEATHER_MID} 20%, ${LEATHER_DARK} 100%)`,
            border: `2px solid ${gold}30`,
            boxShadow: `inset 0 0 80px rgba(0,0,0,0.5)`,
            margin: "env(safe-area-inset-top) 0 0 0",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {renderHeader()}

          {tab === "tiguy" && renderTiGuy()}
          {tab === "inbox" && renderInbox()}
          {tab === "thread" && renderThread()}
        </div>
      </div>
    </>
  );
};

export default TiGuyMessaging;
