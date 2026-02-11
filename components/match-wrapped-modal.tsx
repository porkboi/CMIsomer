"use client";

import { type TouchEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Instagram, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WrappedScript } from "@/lib/match-wrapped";
import mockData from "@/mockData.json";

interface MatchWrappedModalProps {
  partyId: string;
  viewerAndrewID: string;
  initialScript: WrappedScript;
  onOpenChange?: (open: boolean) => void;
}

type WrappedCard = WrappedScript["cards"][number];
type Payload = Record<string, unknown>;
type MockData = {
  mbtiDistribution: { type: string; percentage: number }[];
  majorMinorPopularity: { major: string; minor: string; percentage: number }[];
};
type StatItem = { label: string; count: number };
type RingSlice = { label: string; value: number; color: string };
type RingDatum = {
  axis: string;
  left: RingSlice;
  right: RingSlice;
};

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const radians = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function describeArcPath(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

function buildSmoothCurve(points: { x: number; y: number }[]) {
  if (points.length < 2) return "";
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const controlX = prev.x + (curr.x - prev.x) / 2;
    path += ` C ${controlX} ${prev.y} ${controlX} ${curr.y} ${curr.x} ${curr.y}`;
  }
  return path;
}

function hashStringToUint32(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// Countdown label for locked cards.
function formatCountdown(targetIso: string, now: Date): string {
  const diffMs = new Date(targetIso).getTime() - now.getTime();
  if (diffMs <= 0) return "Unlocked";
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// Gate state resolver used by both initial render and unlock transitions.
function isCardUnlocked(script: WrappedScript, card: WrappedCard): boolean {
  if (!card.gate) return true;
  const gateState = script.meta.gateState;
  switch (card.gate.key) {
    case "majorMinor":
      return gateState.majorMinorUnlocked;
    case "hometown":
      return gateState.hometownUnlocked;
    case "hobbies":
      return gateState.hobbiesUnlocked;
    case "full":
      return gateState.fullUnlocked;
    default:
      return false;
  }
}

function EmphasisHeadline({ text, variant }: { text: string; variant?: "default" | "neonFlash" }) {
  if (variant === "neonFlash") {
    return (
      <motion.h3
        className="mt-2 text-4xl sm:text-6xl font-black leading-[0.95] font-serif tracking-tight"
        style={{
          backgroundImage: "linear-gradient(90deg,#fff,#ffe66d,#ff7ad9,#7cdcff,#fff)",
          backgroundSize: "220% 100%",
          WebkitBackgroundClip: "text",
          color: "transparent",
          textShadow: "0 0 24px rgba(255,255,255,0.35)",
        }}
        animate={{ backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"], scale: [1, 1.02, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        {text}
      </motion.h3>
    );
  }

  return (
    <h3 className="mt-2 text-2xl font-black leading-tight font-serif text-zinc-100">{text}</h3>
  );
}

// Motion preset registry: each card type gets its own distinct background engine.
function KineticBackground({ type, unlocked }: { type: WrappedCard["type"]; unlocked: boolean }) {
  if (type === "orbitalGravityIntro") {
    return (
      <div className="absolute inset-0 overflow-hidden rounded-xl bg-[radial-gradient(circle_at_20%_20%,#7f5af055,transparent_35%),radial-gradient(circle_at_80%_25%,#2cb67d55,transparent_35%),radial-gradient(circle_at_50%_80%,#ff890655,transparent_45%),#05070f]">
        {Array.from({ length: 24 }).map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute h-1 w-1 rounded-full bg-white/60"
            style={{ left: `${(i * 37) % 100}%`, top: `${(i * 23) % 100}%` }}
            animate={{ opacity: [0.2, 0.9, 0.2] }}
            transition={{ duration: 1.6 + (i % 5) * 0.4, repeat: Infinity }}
          />
        ))}
        {[84, 120].map((radius, i) => (
          <motion.div
            key={`orbit-${radius}`}
            className="absolute left-1/2 top-1/2 rounded-full border border-cyan-200/40"
            style={{ width: radius, height: radius, marginLeft: -radius / 2, marginTop: -radius / 2 }}
            animate={{ rotate: i === 0 ? 360 : -360 }}
            transition={{ duration: i === 0 ? 10 : 13, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </div>
    );
  }

  if (type === "cipherCascade") {
    const columns = "01A7ZKM$%#@*&@+//<>[]{}XQ9";
    return (
      <div className="absolute inset-0 overflow-hidden rounded-xl bg-[radial-gradient(circle_at_15%_20%,#0c2b22,transparent_35%),radial-gradient(circle_at_85%_80%,#1a263a,transparent_45%),#04070a]">
        <motion.div
          className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(16,185,129,0.12),transparent)] bg-[length:100%_5px]"
          animate={{ y: [-8, 8, -8] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:3px_3px] opacity-20" />
        {Array.from({ length: 22 }).map((_, i) => (
          <motion.div
            key={`col-${i}`}
            className="absolute font-mono text-[10px] tracking-wide text-emerald-200/75 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]"
            style={{ left: `${i * 4.8}%`, top: "14%", opacity: i % 3 === 0 ? 0.9 : 0.5 }}
            animate={{ y: ["-14%", "110%"], opacity: unlocked ? [0.3, 1, 0.35] : [0.2, 0.85, 0.2] }}
            transition={{ duration: 1.8 + (i % 5) * 0.55, repeat: Infinity, ease: "linear", delay: i * 0.07 }}
          >
            {Array.from({ length: 38 })
              .map((__, idx) => columns[(i * 2 + idx * 5) % columns.length])
              .join("")}
          </motion.div>
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={`glitch-${i}`}
            className="absolute left-0 right-0 h-[2px] bg-emerald-100/75"
            style={{ top: `${12 + i * 18}%` }}
            animate={{ x: ["-20%", "20%", "-20%"], opacity: [0, 0.9, 0] }}
            transition={{ duration: 0.5 + i * 0.08, repeat: Infinity, repeatDelay: 1.1 + i * 0.15 }}
          />
        ))}
      </div>
    );
  }

  if (type === "blueprintDraftReveal") {
    return (
      <div className="absolute inset-0 overflow-hidden rounded-xl bg-[#081c3a]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,197,255,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,197,255,0.2)_1px,transparent_1px)] bg-[size:28px_28px]" />
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={`line-${i}`}
            className="absolute left-8 right-8 h-px bg-cyan-200/60"
            style={{ top: `${18 + i * 12}%` }}
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: unlocked ? 1 : [0, 0.7, 0.2] }}
            transition={{ duration: 1.2, repeat: unlocked ? 0 : Infinity, repeatDelay: 0.5, delay: i * 0.08 }}
          />
        ))}

        <motion.div
          className="absolute bottom-8 left-1/2 h-8 w-20 -translate-x-1/2 rounded-md border border-cyan-200/70 bg-cyan-300/20"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-[calc(2rem+2px)] left-1/2 h-10 w-20 origin-bottom -translate-x-1/2 rounded-t-md border border-cyan-200/80 bg-cyan-100/30"
          animate={{ rotateX: unlocked ? [-28, -8, -28] : [-18, -32, -18] }}
          transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
          style={{ perspective: 800 }}
        />
      </div>
    );
  }

  if (type === "topographicMorph") {
    return (
      <div className="absolute inset-0 overflow-hidden rounded-xl bg-[#181611]">
        {Array.from({ length: 9 }).map((_, i) => (
          <motion.div
            key={`topo-${i}`}
            className="absolute left-1/2 top-1/2 rounded-full border border-amber-100/30"
            style={{ width: 70 + i * 26, height: 40 + i * 14, marginLeft: -(70 + i * 26) / 2, marginTop: -(40 + i * 14) / 2 }}
            animate={{ scale: [1, 1.05, 1], opacity: [0.25, 0.55, 0.25] }}
            transition={{ duration: 3.2 + i * 0.25, repeat: Infinity }}
          />
        ))}
        <motion.div
          className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-300"
          animate={{ scale: [1, 1.8, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      </div>
    );
  }

  if (type === "constellationBuild") {
    const points = [
      [18, 34],
      [33, 22],
      [47, 38],
      [60, 28],
      [74, 44],
      [56, 58],
      [27, 56],
    ];
    return (
      <div className="absolute inset-0 overflow-hidden rounded-xl bg-[#03081f]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {points.slice(0, -1).map((point, i) => (
            <motion.line
              key={`edge-${i}`}
              x1={point[0]}
              y1={point[1]}
              x2={points[i + 1][0]}
              y2={points[i + 1][1]}
              stroke="rgba(186,230,253,0.55)"
              strokeWidth="0.4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: unlocked ? 1 : 0.45 }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
            />
          ))}
        </svg>
        {points.map((point, i) => (
          <motion.div
            key={`node-${i}`}
            className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
            style={{ left: `${point[0]}%`, top: `${point[1]}%` }}
            animate={{ scale: [1, 1.5, 1], opacity: unlocked ? [0.8, 1, 0.8] : [0.3, 0.7, 0.3] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.1 }}
          />
        ))}
      </div>
    );
  }

  if (type === "spectrumSplit") {
    return (
      <div className="absolute inset-0 overflow-hidden rounded-xl bg-black">
        <motion.div
          className="absolute inset-0 bg-[linear-gradient(90deg,#ff6b6b,#ffd93d,#6bcB77,#4d96ff,#ff6b6b)]"
          style={{ backgroundSize: "200% 100%" }}
          animate={{ backgroundPosition: ["0% 0%", "100% 0%"] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />
        {[32, 68].map((x, i) => (
          <motion.div
            key={`beam-${x}`}
            className="absolute top-0 bottom-0 w-1 bg-white/85 shadow-[0_0_25px_8px_rgba(255,255,255,0.45)]"
            style={{ left: `${x}%` }}
            animate={{ x: i === 0 ? [-4, 4, -4] : [4, -4, 4] }}
            transition={{ duration: 2.4, repeat: Infinity }}
          />
        ))}
      </div>
    );
  }

  if (type === "reactorSim") {
    return (
      <div className="absolute inset-0 overflow-hidden rounded-xl bg-[radial-gradient(circle_at_center,#0f3422,#020806)]">
        {[112, 80, 50].map((size, i) => (
          <motion.div
            key={`ring-${size}`}
            className="absolute left-1/2 top-1/2 rounded-full border border-emerald-300/35"
            style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }}
            animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
            transition={{ duration: 7 + i * 2.5, repeat: Infinity, ease: "linear" }}
          />
        ))}
        {Array.from({ length: 9 }).map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute h-2 w-2 rounded-full bg-emerald-200"
            style={{ left: `${20 + (i * 9) % 60}%`, top: `${25 + (i * 11) % 50}%` }}
            animate={{ y: [-6, 8, -6], x: [-4, 4, -4], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2 + i * 0.14, repeat: Infinity }}
          />
        ))}
      </div>
    );
  }

  if (type === "neonFlashTransition") {
    return (
      <div className="absolute inset-0 overflow-hidden rounded-xl bg-[#16002b]">
        <motion.div
          className="absolute inset-0 bg-[linear-gradient(135deg,#ffef5a,#ff7a18,#ff2d95,#5b4bff,#00d4ff)]"
          style={{ backgroundSize: "240% 240%" }}
          animate={{ backgroundPosition: ["0% 0%", "100% 60%", "10% 100%", "0% 0%"] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.65),transparent_45%)] mix-blend-screen"
          animate={{ scale: [0.6, 1.2, 0.7], opacity: [0.5, 0.95, 0.45] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden rounded-xl bg-[linear-gradient(135deg,#28211c,#121315)]">
      <div className="absolute inset-0 flex">
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={`panel-${i}`}
            className="h-full flex-1 border-r border-zinc-700 bg-gradient-to-b from-zinc-400/15 to-zinc-800/45"
            initial={{ rotateY: 0 }}
            animate={{ rotateY: unlocked ? 90 : [0, 35, 0] }}
            transition={{ duration: 0.7, delay: i * 0.05, repeat: unlocked ? 0 : Infinity, repeatDelay: 0.8 }}
          />
        ))}
      </div>
      {unlocked &&
        Array.from({ length: 26 }).map((_, i) => (
          <motion.div
            key={`confetti-${i}`}
            className="absolute h-2 w-1 rounded bg-yellow-300"
            style={{ left: `${(i * 17) % 100}%`, top: "-10%" }}
            animate={{ y: ["0%", "120%"], rotate: [0, 220] }}
            transition={{ duration: 1.4 + (i % 5) * 0.3, repeat: Infinity, delay: (i % 6) * 0.1 }}
          />
        ))}
    </div>
  );
}

function GenericContent({
  payload,
  unlocked,
  now,
  cardType,
}: {
  payload: Payload;
  unlocked: boolean;
  now: Date;
  cardType?: WrappedCard["type"];
}) {
  const isNeonFlash = cardType === "neonFlashTransition";
  const isHobbiesSlide = cardType === "constellationBuild";
  return (
    <>
      {"title" in payload && <EmphasisHeadline text={String(payload.title)} variant={isNeonFlash ? "neonFlash" : "default"} />}
      {"subtitle" in payload && (
        <p className={isNeonFlash ? "mt-4 text-lg sm:text-2xl font-serif text-white/95 drop-shadow-[0_0_18px_rgba(255,255,255,0.45)]" : "mt-2 text-zinc-300"}>
          {String(payload.subtitle)}
        </p>
      )}
      {"label" in payload && <p className="mt-5 text-sm uppercase tracking-[0.15em] text-zinc-300 font-serif">{String(payload.label)}</p>}
      {"value" in payload && (
        <p className={`mt-2 font-extrabold text-emerald-300 ${isHobbiesSlide ? "text-xl sm:text-2xl" : "text-3xl"}`}>
          {isHobbiesSlide ? "Your Match is into these activities" : String(payload.value)}
        </p>
      )}
      {"countdownTo" in payload && !unlocked && (
        <p className="mt-3 inline-flex rounded-full border border-zinc-500/80 bg-black/40 px-3 py-1 text-sm text-zinc-100">
          Unlocks in {formatCountdown(String(payload.countdownTo), now)}
        </p>
      )}
      {"mbti" in payload && (
        <p className="mt-4 text-lg">
          Your MBTI: <span className="font-bold text-orange-300">{String(payload.mbti)}</span>
        </p>
      )}
      {"idealFriday" in payload && <p className="mt-3 text-zinc-100">Your Friday vibe: {String(payload.idealFriday)}</p>}
      {"hobbies" in payload && <p className={isHobbiesSlide ? "mt-3 text-sm text-zinc-100 sm:text-base" : "mt-3 text-zinc-100"}>Your hobbies: {String(payload.hobbies)}</p>}
      {"mbtiPersonality" in payload && (
        <p className="mt-4 text-lg text-zinc-100">
          MBTI Personality: <span className="font-bold text-emerald-200">{String(payload.mbtiPersonality)}</span>
        </p>
      )}
      {"compatibilityScore" in payload && (
        <div className="mt-4 max-w-sm">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-300 font-serif">Your signal score</p>
          <div className="mt-2 h-3 w-full rounded bg-white/20">
            <motion.div
              className="h-full rounded bg-gradient-to-r from-red-300 via-yellow-300 to-green-300"
              initial={{ width: "0%" }}
              animate={{ width: `${Number(payload.compatibilityScore) || 0}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <p className="mt-1 text-sm text-zinc-100">{String(payload.compatibilityScore)}%</p>
        </div>
      )}
      {"axes" in payload && Array.isArray(payload.axes) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {payload.axes.map((axis) => (
            <span key={String(axis)} className="rounded-full border border-zinc-300/35 bg-black/35 px-2 py-1 text-xs text-zinc-100">
              {String(axis)}
            </span>
          ))}
        </div>
      )}
      {"tags" in payload && Array.isArray(payload.tags) && payload.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {payload.tags.map((tag) => (
            <span key={String(tag)} className={`rounded-full bg-emerald-500/25 px-3 py-1 text-emerald-100 ${isHobbiesSlide ? "text-xs sm:text-sm" : "text-sm"}`}>
              {String(tag)}
            </span>
          ))}
        </div>
      )}
      {"name" in payload && (
        <p className="mt-4 text-4xl font-black text-pink-200 font-serif">{String(payload.name)}</p>
      )}
      {"profile" in payload && Array.isArray(payload.profile) && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {payload.profile.map((item) => {
            if (!item || typeof item !== "object") return null;
            const label = "label" in item ? String(item.label) : "";
            const value = "value" in item ? String(item.value) : "";
            return (
              <div key={`${label}-${value}`} className="rounded-lg border border-zinc-600 bg-black/45 p-3">
                <p className="text-xs uppercase tracking-wide text-zinc-400 font-serif">{label}</p>
                <p className="mt-1 text-sm text-zinc-100">{value}</p>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function BlueprintMajorMinorBubble({ items }: { items: StatItem[] }) {
  const topMajorMinor = items[0];
  const maxCount = Math.max(...items.map((item) => item.count), 1);
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 w-[84%] max-w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-cyan-100/55 bg-[#071c34db] px-4 py-3 text-cyan-100 shadow-[0_12px_45px_rgba(6,24,56,0.45)] backdrop-blur-[2px]">
      <p className="text-[10px] uppercase tracking-[0.16em] text-cyan-200">Major/Minor Breakdown</p>
      <div className="mt-2 space-y-1.5">
        {items.slice(0, 4).map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between text-[10px]">
              <span className="truncate pr-2">{item.label}</span>
              <span>{item.count}</span>
            </div>
            <div className="mt-0.5 h-1 rounded bg-cyan-100/20">
              <div className="h-full rounded bg-cyan-200/85" style={{ width: `${(item.count / maxCount) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      {topMajorMinor && <p className="mt-2 text-[12px] text-cyan-100">That&apos;s {topMajorMinor.count} people.</p>}
      <div className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-cyan-100/55 bg-[#071c34db]" />
    </div>
  );
}

function computeMbtiTraitBreakdown(mbtiDistribution: StatItem[]) {
  const letterColors: Record<string, string> = {
    E: "#22c55e",
    I: "#38bdf8",
    S: "#eab308",
    N: "#a78bfa",
    T: "#f97316",
    F: "#f472b6",
    J: "#14b8a6",
    P: "#f43f5e",
  };
  const totals: Record<string, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  let validTotal = 0;
  let invalidTotal = 0;
  const mbtiRegex = /^[EI][SN][TF][JP]$/;

  mbtiDistribution.forEach(({ label, count }) => {
    const normalized = label.trim().toUpperCase();
    const weight = Math.max(0, Number(count) || 0);
    if (!mbtiRegex.test(normalized)) {
      invalidTotal += weight;
      return;
    }
    validTotal += weight;
    totals[normalized[0]] += weight;
    totals[normalized[1]] += weight;
    totals[normalized[2]] += weight;
    totals[normalized[3]] += weight;
  });

  const axes = [
    { axis: "E/I", left: "E", right: "I" },
    { axis: "S/N", left: "S", right: "N" },
    { axis: "T/F", left: "T", right: "F" },
    { axis: "J/P", left: "J", right: "P" },
  ] as const;

  const rings: RingDatum[] = axes.map((entry) => ({
    axis: entry.axis,
    left: { label: entry.left, value: totals[entry.left], color: letterColors[entry.left] },
    right: { label: entry.right, value: totals[entry.right], color: letterColors[entry.right] },
  }));

  return { rings, validTotal, invalidTotal };
}

function ReactorMbtiOverlay({ mbtiDistribution, viewerName }: { mbtiDistribution: StatItem[]; viewerName: string }) {
  const { rings, validTotal, invalidTotal } = computeMbtiTraitBreakdown(mbtiDistribution);
  const ringRadii = [48, 37, 26, 15];
  const baseAngle = hashStringToUint32(viewerName.trim().toLowerCase() || "viewer") % 360;
  const ringAngles = rings.map((ring, idx) => {
    const seed = hashStringToUint32(`${viewerName}|${ring.axis}|${idx}`);
    return (baseAngle + (seed % 120) + idx * 19) % 360;
  });
  const letterMidpoints = rings
    .flatMap((ring, idx) => {
      const radius = ringRadii[idx] ?? 15;
      const axisTotal = Math.max(ring.left.value + ring.right.value, 1);
      const leftProp = ring.left.value / axisTotal;
      const rightProp = ring.right.value / axisTotal;
      const startAngle = ringAngles[idx] ?? baseAngle;
      const leftMidAngle = startAngle + leftProp * 180;
      const rightMidAngle = startAngle + leftProp * 360 + rightProp * 180;
      const leftMid = polarToCartesian(60, 60, radius, leftMidAngle);
      const rightMid = polarToCartesian(60, 60, radius, rightMidAngle);
      return [leftMid, rightMid];
    })
    .sort((a, b) => a.y - b.y);
  const curvePath = buildSmoothCurve(letterMidpoints);

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute inset-0 flex items-center justify-center px-4 pt-50 sm:pt-14">
        <div className="grid w-full max-w-[620px] grid-cols-1 items-center gap-4 text-emerald-100 sm:grid-cols-[200px_1fr] sm:gap-6">
          <div className="relative h-[200px] w-[200px] justify-self-center">
            <svg viewBox="0 0 120 120" className="h-full w-full">
              {rings.map((ring, idx) => {
                const radius = ringRadii[idx] ?? 15;
                const axisTotal = Math.max(ring.left.value + ring.right.value, 1);
                const leftProp = ring.left.value / axisTotal;
                const rightProp = ring.right.value / axisTotal;
                const startAngle = ringAngles[idx] ?? baseAngle;
                const leftEndAngle = startAngle + leftProp * 360;
                const rightEndAngle = startAngle + 360;
                const leftPath = describeArcPath(60, 60, radius, startAngle, leftEndAngle);
                const rightPath = describeArcPath(60, 60, radius, leftEndAngle, rightEndAngle);
                return (
                  <g key={ring.axis}>
                    {leftProp > 0 && (
                      <motion.path
                        d={leftPath}
                        fill="none"
                        stroke={ring.left.color}
                        strokeWidth="6"
                        strokeLinecap="butt"
                        initial={{ pathLength: 0, opacity: 0.7 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.6, delay: idx * 0.08, ease: "easeOut" }}
                      />
                    )}
                    {rightProp > 0 && (
                      <motion.path
                        d={rightPath}
                        fill="none"
                        stroke={ring.right.color}
                        strokeWidth="6"
                        strokeLinecap="butt"
                        initial={{ pathLength: 0, opacity: 0.7 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.05 + idx * 0.08, ease: "easeOut" }}
                      />
                    )}
                  </g>
                );
              })}
            </svg>
            <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full z-30">
              <path d={curvePath} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" transform="rotate(90 60 60)" />
              <motion.path
                d={curvePath}
                fill="none"
                stroke="rgba(255,255,255,0.95)"
                strokeWidth="0.7"
                strokeLinecap="round"
                strokeDasharray="2.2 2.2"
                transform="rotate(0 60 60)"
                animate={{ strokeDashoffset: [0, -18] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: "linear" }}
              />
            </svg>
          </div>
          <div className="w-full space-y-2 text-sm">
            <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200">MBTI Trait Breakdown</p>
            {rings.map((ring) => (
              <div key={ring.axis} className="flex items-center justify-between gap-3 rounded-full border border-emerald-200/25 bg-black/20 px-3 py-1.5">
                <span className="text-[12px] tracking-wide text-emerald-100/90">{ring.axis}</span>
                <div className="flex items-center gap-2 text-[12px]">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ring.left.color }} />
                    {ring.left.label} {ring.left.value}/{validTotal}
                  </span>
                  <span className="text-emerald-100/60">|</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ring.right.color }} />
                    {ring.right.label} {ring.right.value}/{validTotal}
                  </span>
                </div>
              </div>
            ))}
            {invalidTotal > 0 && <p className="text-[10px] text-emerald-100/70">Dropped {invalidTotal} invalid MBTI entries.</p>}
          </div>
        </div>
      </div>

    </div>
  );
}

export default function MatchWrappedModal({
  partyId,
  viewerAndrewID,
  initialScript,
  onOpenChange,
}: MatchWrappedModalProps) {
  const [open, setOpen] = useState(false);
  const [script, setScript] = useState(initialScript);
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState<Date>(new Date(initialScript.meta.now));
  const [justUnlockedId, setJustUnlockedId] = useState<string | null>(null);
  const [shareState, setShareState] = useState<"idle" | "shared" | "copied" | "error">("idle");
  const [neonZooming, setNeonZooming] = useState(false);
  const previousScriptRef = useRef(initialScript);
  const touchStartY = useRef<number | null>(null);
  const neonZoomTimeoutRef = useRef<number | null>(null);

  const cards = script.cards;
  const currentCard = cards[index];
  const unlocked = isCardUnlocked(script, currentCard);
  const payload = (unlocked ? currentCard.data.unlocked : currentCard.data.locked || currentCard.data.unlocked) as Payload;

  // Server-authoritative script refresh at boundaries / polling intervals.
  const refreshScript = useCallback(async () => {
    const response = await fetch(
      `/api/match-wrapped?partyId=${encodeURIComponent(partyId)}&viewerAndrewID=${encodeURIComponent(viewerAndrewID)}`,
      { cache: "no-store" }
    );
    if (!response.ok) return;
    const nextScript: WrappedScript = await response.json();
    const previous = previousScriptRef.current;

    nextScript.cards.forEach((card) => {
      if (!card.gate) return;
      const prevUnlocked = isCardUnlocked(previous, card);
      const nextUnlocked = isCardUnlocked(nextScript, card);
      if (!prevUnlocked && nextUnlocked) setJustUnlockedId(card.id);
    });

    previousScriptRef.current = nextScript;
    setScript(nextScript);
    setNow(new Date(nextScript.meta.now));
  }, [partyId, viewerAndrewID]);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const tick = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(tick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const pollMs = 30_000;
    const poll = window.setInterval(() => {
      if (!script.meta.gateState.fullUnlocked) {
        void refreshScript();
      }
    }, pollMs);
    return () => window.clearInterval(poll);
  }, [open, refreshScript, script.meta.gateState.fullUnlocked]);

  useEffect(() => {
    if (!open) return;
    const nextUnlockAt = script.meta.gateState.nextUnlockAt;
    if (!nextUnlockAt) return;
    const delay = Math.max(new Date(nextUnlockAt).getTime() - Date.now() + 200, 0);
    const timeout = window.setTimeout(() => {
      void refreshScript();
    }, delay);
    return () => window.clearTimeout(timeout);
  }, [open, refreshScript, script.meta.gateState.nextUnlockAt]);

  useEffect(() => {
    if (!justUnlockedId) return;
    const timeout = window.setTimeout(() => setJustUnlockedId(null), 1600);
    return () => window.clearTimeout(timeout);
  }, [justUnlockedId]);

  // Reset share status when user moves to another slide.
  useEffect(() => {
    setShareState("idle");
  }, [index]);

  const goNext = useCallback(() => {
    if (cards[index]?.type === "neonFlashTransition" && index < cards.length - 1) {
      setNeonZooming(true);
      if (neonZoomTimeoutRef.current) {
        window.clearTimeout(neonZoomTimeoutRef.current);
      }
      neonZoomTimeoutRef.current = window.setTimeout(() => {
        setIndex((value) => Math.min(value + 1, cards.length - 1));
        setNeonZooming(false);
      }, 360);
      return;
    }
    setIndex((value) => Math.min(value + 1, cards.length - 1));
  }, [cards, index]);

  const goBack = useCallback(() => {
    setIndex((value) => Math.max(value - 1, 0));
  }, []);

  const onTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    touchStartY.current = event.changedTouches[0]?.clientY ?? null;
  }, []);

  const onTouchEnd = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (touchStartY.current === null) return;
      const endY = event.changedTouches[0]?.clientY ?? touchStartY.current;
      const deltaY = endY - touchStartY.current;
      touchStartY.current = null;
      if (Math.abs(deltaY) < 45) return;
      if (deltaY > 0) {
        goBack();
      } else {
        goNext();
      }
    },
    [goBack, goNext]
  );

  // Web share first, clipboard + Instagram fallback second.
  const handleInstagramShare = useCallback(async () => {
    const name = typeof payload.name === "string" ? payload.name : "my match";
    const shareText = `I just unlocked my CM Isomer match with ${name}.`;
    const shareUrl = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title: "CM Isomer Match Wrapped", text: shareText, url: shareUrl });
        setShareState("shared");
        return;
      }

      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setShareState("copied");
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
    } catch {
      setShareState("error");
    }
  }, [payload.name]);

  const progressDots = useMemo(() => cards.map((card) => card.id), [cards]);
  const mbtiDistribution = useMemo(
    () =>
      [...(mockData as MockData).mbtiDistribution]
        .sort((a, b) => b.percentage - a.percentage)
        .map((entry) => ({ label: entry.type, count: Math.round(entry.percentage) })),
    []
  );
  const majorMinorPopularity = useMemo(
    () =>
      [...(mockData as MockData).majorMinorPopularity]
        .sort((a, b) => b.percentage - a.percentage)
        .map((entry) => ({ label: `${entry.major} + ${entry.minor}`, count: Math.round(entry.percentage) })),
    []
  );

  useEffect(() => {
    return () => {
      if (neonZoomTimeoutRef.current) {
        window.clearTimeout(neonZoomTimeoutRef.current);
      }
    };
  }, []);

  // Mobile scroll lock: prevent page scroll behind fullscreen modal.
  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;
    const isMobile = window.matchMedia("(max-width: 639px)").matches;
    if (!isMobile) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [open]);

  return (
    <>
      {/* Entry CTA anchored to ticket page top-right */}
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <motion.div
          className="mb-2 flex items-center justify-end gap-2 text-xs font-semibold text-emerald-200 sm:text-sm"
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span>Explore your match wrapped</span>
          <ArrowRight className="h-4 w-4" />
        </motion.div>
        <Button type="button" onClick={() => setOpen(true)} className="bg-emerald-500 text-black hover:bg-emerald-400 font-semibold shadow-lg text-xs sm:text-sm">
          <Sparkles className="mr-2 h-4 w-4" />
          View your match live
        </Button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 overflow-hidden bg-black/85 sm:px-8 sm:py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ overscrollBehavior: "none" }}
          >
            <div className="flex h-[100dvh] max-h-[100dvh] w-screen flex-col overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 p-3 text-white sm:mx-auto sm:h-full sm:w-full sm:max-w-3xl sm:rounded-2xl sm:border sm:border-zinc-700 sm:p-6">
              {/* Modal header */}
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-serif sm:text-xs">Match Wrapped</p>
                  <h2 className="text-lg font-bold sm:text-2xl font-serif">You are in your live reveal timeline, {script.meta.viewerName}.</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-zinc-600 p-2 text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
                  aria-label="Close match wrapped"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Active slide canvas */}
              <div
                className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-zinc-700 bg-black/35 p-3 sm:p-6"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                style={{ touchAction: "pan-y" }}
              >
                <div className="pointer-events-none absolute left-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2">
                  {progressDots.map((dotId, dotIndex) => {
                    const isActive = dotIndex === index;
                    return (
                      <motion.span
                        key={dotId}
                        className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
                          isActive ? "border-zinc-300/45 bg-zinc-300/15" : "border-transparent bg-transparent"
                        }`}
                        animate={{ scale: isActive ? 1.05 : 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-zinc-100" : "bg-zinc-500/75"}`} />
                      </motion.span>
                    );
                  })}
                </div>
                {currentCard.type === "blueprintDraftReveal" && <BlueprintMajorMinorBubble items={majorMinorPopularity} />}
                {currentCard.type === "reactorSim" && <ReactorMbtiOverlay mbtiDistribution={mbtiDistribution} viewerName={script.meta.viewerName} />}
                <KineticBackground type={currentCard.type} unlocked={unlocked} />
                <motion.div
                  key={`${currentCard.id}-${unlocked ? "unlocked" : "locked"}`}
                  className={`relative z-10 rounded-lg p-4 backdrop-blur-[1px] ${
                    currentCard.type === "neonFlashTransition" ? "bg-black/20 border border-white/25 shadow-[0_0_35px_rgba(255,255,255,0.2)]" : "bg-black/45"
                  } ${currentCard.type === "neonFlashTransition" ? "absolute left-1/2 top-1/2 flex h-[72vw] max-h-[430px] w-[72vw] max-w-[430px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-3xl text-center sm:h-[58vh] sm:w-[58vh]" : ""}`}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{
                    opacity: neonZooming && currentCard.type === "neonFlashTransition" ? 0 : 1,
                    y: 0,
                    scale:
                      neonZooming && currentCard.type === "neonFlashTransition"
                        ? 1.55
                        : justUnlockedId === currentCard.id
                          ? [1, 1.02, 1]
                          : 1,
                  }}
                  transition={{ duration: neonZooming && currentCard.type === "neonFlashTransition" ? 0.35 : 0.35, ease: "easeInOut" }}
                >
                  <GenericContent payload={payload} unlocked={unlocked} now={now} cardType={currentCard.type} />

                  {currentCard.id === "full-reveal" && unlocked && (
                    <div className="mt-5 flex items-center gap-3">
                      <Button type="button" onClick={() => void handleInstagramShare()} className="bg-pink-500 text-black hover:bg-pink-400">
                        <Instagram className="mr-2 h-4 w-4" />
                        Share to Instagram
                      </Button>
                      {shareState === "shared" && <p className="text-sm text-emerald-200">Shared.</p>}
                      {shareState === "copied" && <p className="text-sm text-emerald-200">Caption copied. Instagram opened.</p>}
                      {shareState === "error" && <p className="text-sm text-rose-200">Could not share right now.</p>}
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Slide navigation */}
              <div className="mt-3 flex items-center justify-center">
                <p className="text-sm text-zinc-400 font-serif">
                  Slide {index + 1} / {cards.length}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
