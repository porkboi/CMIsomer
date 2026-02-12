"use client";

import { type TouchEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Instagram, Lock, Sparkles, X } from "lucide-react";
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
type ShareState = "idle" | "opened" | "fallback" | "error";

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
  const isCompatibilitySlide = cardType === "spectrumSplit";
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
        <div className={`mt-4 max-w-sm ${isCompatibilitySlide ? "mx-auto" : ""}`}>
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
        <div className={`mt-3 flex flex-wrap gap-2 ${isCompatibilitySlide ? "justify-center" : ""}`}>
          {payload.axes.map((axis) => (
            <span key={String(axis)} className="rounded-full border border-zinc-300/35 bg-black/35 px-2 py-1 text-xs text-zinc-100">
              {String(axis)}
            </span>
          ))}
        </div>
      )}
      {"tags" in payload && Array.isArray(payload.tags) && payload.tags.length > 0 && (
        <div className={`mt-4 flex flex-wrap gap-2 ${isHobbiesSlide ? "justify-center" : ""}`}>
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

function HometownBaggageReveal({
  hometown,
  revealed,
  onReveal,
}: {
  hometown: string;
  revealed: boolean;
  onReveal: () => void;
}) {
  return (
    <div className="mt-8 flex flex-col items-center">
      <div className="relative h-44 w-full max-w-sm">
        <div className="absolute inset-x-2 top-4 h-32 rounded-[28px] bg-zinc-200 shadow-[0_10px_24px_rgba(0,0,0,0.35)]" />
        <div className="absolute left-2 right-[27%] top-4 h-8 rounded-tl-[28px] rounded-tr-[18px] bg-orange-500" />
        <div className="absolute left-[74%] right-2 top-4 h-8 rounded-tl-[18px] rounded-tr-[28px] bg-orange-500" />
        <div className="absolute left-2 right-[27%] top-28 h-8 rounded-bl-[28px] rounded-br-[18px] bg-orange-500" />
        <div className="absolute left-[74%] right-2 top-28 h-8 rounded-bl-[18px] rounded-br-[28px] bg-orange-500" />
        <div className="absolute left-[72.6%] top-13 h-1 w-[1px] bg-zinc-300" />
        <div className="absolute left-[72.6%] top-[58px] h-1 w-[1px] bg-zinc-300" />
        <div className="absolute left-[72.6%] top-[68px] h-1 w-[1px] bg-zinc-300" />
        <div className="absolute left-[72.6%] top-[78px] h-1 w-[1px] bg-zinc-300" />
        <div className="absolute left-[72.6%] top-[88px] h-1 w-[1px] bg-zinc-300" />
        <div className="absolute left-12 top-[62px] text-[58px] leading-none text-slate-800">✈</div>
        <div className="absolute left-[39%] top-[56px] h-3 w-[110px] bg-zinc-400/80" />
        <div className="absolute left-[39%] top-[74px] h-3 w-[110px] bg-zinc-400/80" />
        <div className="absolute left-[39%] top-[92px] h-3 w-[110px] bg-zinc-400/80" />
        <div className="absolute left-[78%] top-[54px] h-4 w-3 bg-zinc-400/80" />
        <div className="absolute left-[86%] top-[54px] h-4 w-3 bg-zinc-400/80" />
        <div className="absolute left-[78%] top-[78px] h-4 w-3 bg-zinc-400/80" />
        <div className="absolute left-[86%] top-[78px] h-4 w-3 bg-zinc-400/80" />
        <motion.button
          type="button"
          className="absolute right-[16%] top-[44px] z-10 h-[72px] w-[88px] rounded-2xl border border-zinc-300 bg-white px-2 py-2 text-left shadow-[0_8px_16px_rgba(0,0,0,0.35)]"
          onClick={() => {
            if (!revealed) onReveal();
          }}
          whileTap={revealed ? undefined : { scale: 0.95, rotate: -3 }}
          animate={revealed ? { x: 0, y: 0, rotate: -4, opacity: 0, scale: 0.96 } : { x: 0, y: 0, rotate: -4, opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          aria-label="Tap flight ticket to reveal hometown"
        >
          <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-black">Tap Me</p>
          <p className="mt-1 text-[8px] uppercase tracking-[0.08em] text-zinc-500">Reveal Hometown</p>
          <div className="mt-1 h-1.5 w-full bg-zinc-300" />
        </motion.button>
        <AnimatePresence>
          {revealed && (
            <motion.div
              className="absolute inset-x-4 bottom-14 rounded-xl border border-emerald-100/55 bg-black/45 px-3 py-2 text-center"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
            >
              <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-200">Hometown</p>
              <p className="mt-1 text-lg font-black text-emerald-100">{hometown}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {!revealed && <p className="mt-2 text-xs font-medium text-zinc-100">You need to tap the flight ticket to reveal the hometown and continue.</p>}
    </div>
  );
}

function FinalRevealStoryCard({
  payload,
  shareState,
  onShare,
}: {
  payload: Payload;
  shareState: ShareState;
  onShare: () => void;
}) {
  const name = typeof payload.name === "string" ? payload.name : "Your match";
  const profileItems =
    "profile" in payload && Array.isArray(payload.profile)
      ? payload.profile.filter((item): item is { label: string; value: string } => {
          if (!item || typeof item !== "object") return false;
          const label = "label" in item ? item.label : null;
          const value = "value" in item ? item.value : null;
          return typeof label === "string" && typeof value === "string";
        })
      : [];

  return (
    <motion.div
      className="relative max-h-[72vh] overflow-y-auto rounded-3xl border border-white/45 bg-[linear-gradient(160deg,#ff9f1c,#ff4d6d,#8eecf5)] p-4 sm:p-6 text-zinc-950 shadow-[0_18px_55px_rgba(0,0,0,0.35)]"
      style={{ backgroundSize: "180% 180%" }}
      animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/25 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-14 h-48 w-48 rounded-full bg-fuchsia-200/35 blur-2xl" />
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-900/80">Your final reveal</p>
      <h3 className="mt-2 text-3xl font-black leading-tight text-zinc-950 sm:text-4xl">{name}</h3>
      <p className="mt-2 text-sm text-zinc-900/85">Everything you unlocked is here in one story-ready card.</p>

      <div className="mt-4 grid gap-2">
        {profileItems.map((item) => (
          <div key={`${item.label}-${item.value}`} className="rounded-xl border border-white/25 bg-zinc-900/60 px-3 py-2 backdrop-blur-[1px]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-300">{item.label}</p>
            <p className="mt-1 text-sm font-medium text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Button type="button" onClick={onShare} className="bg-zinc-950 text-white hover:bg-zinc-800">
          <Instagram className="mr-2 h-4 w-4" />
          Share to Instagram Story
        </Button>
        {shareState === "opened" && <p className="text-sm font-semibold text-zinc-900">Opening Instagram app...</p>}
        {shareState === "fallback" && <p className="text-sm font-semibold text-zinc-900">Instagram app unavailable. Opened web fallback.</p>}
        {shareState === "error" && <p className="text-sm font-semibold text-zinc-900">Could not open Instagram right now.</p>}
      </div>
    </motion.div>
  );
}

function BlueprintMajorMinorBubble({ items }: { items: StatItem[] }) {
  const topItems = items.slice(0, 4);
  const maxCount = Math.max(...topItems.map((item) => item.count), 1);
  const totalCount = Math.max(topItems.reduce((sum, item) => sum + item.count, 0), 1);
  const palette = ["#67e8f9", "#22d3ee", "#06b6d4", "#0891b2"];
  return (
    <div className="pointer-events-none absolute left-1/2 top-[58%] z-20 w-[min(78vw,24rem)] -translate-x-1/2 -translate-y-1/2 px-2 text-cyan-100 sm:top-[60%] sm:w-[min(66%,22rem)]">
      <p className="text-[clamp(10px,1.4vw,12px)] uppercase tracking-[0.2em] text-cyan-100">Major/Minor Breakdown</p>
      <div className="mt-[clamp(0.4rem,1.2vh,0.75rem)] h-[clamp(0.5rem,1.8vh,1rem)] overflow-hidden rounded-full border border-cyan-100/35 bg-cyan-100/10">
        <div className="flex h-full">
          {topItems.map((item, idx) => (
            <div key={`seg-${item.label}`} className="h-full" style={{ width: `${(item.count / totalCount) * 100}%`, backgroundColor: palette[idx] ?? "#67e8f9" }} />
          ))}
        </div>
      </div>
      <div className="mt-[clamp(0.5rem,1.6vh,1rem)] space-y-[clamp(0.3rem,1.3vh,0.75rem)]">
        {topItems.map((item, idx) => (
          <div key={item.label}>
            <div className="flex items-center justify-between gap-2 text-[clamp(10px,1.4vw,12px)]">
              <span className="inline-flex min-w-0 items-center gap-2">
                <span className="h-[clamp(8px,1.5vw,10px)] w-[clamp(8px,1.5vw,10px)] shrink-0 rounded-full" style={{ backgroundColor: palette[idx] ?? "#67e8f9" }} />
                <span className="truncate pr-1">{item.label}</span>
              </span>
              <span className="shrink-0 text-cyan-50">{Math.round((item.count / totalCount) * 100)}%</span>
            </div>
            <div className="mt-[clamp(0.2rem,0.8vh,0.4rem)] h-[clamp(6px,1.3vh,10px)] rounded-full bg-cyan-100/20">
              <div className="h-full rounded" style={{ width: `${(item.count / maxCount) * 100}%`, backgroundColor: palette[idx] ?? "#67e8f9" }} />
            </div>
          </div>
        ))}
      </div>
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
      <div className="absolute left-1/2 top-1/2 h-[clamp(140px,28vw,220px)] w-[clamp(140px,28vw,220px)] -translate-x-1/2 -translate-y-1/2">
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
        <svg viewBox="0 0 120 120" className="absolute inset-0 z-30 h-full w-full">
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
      <div className="absolute inset-x-2 bottom-3 mx-auto w-[min(84vw,32rem)] space-y-[clamp(0.3rem,1vh,0.5rem)] text-[clamp(11px,1.6vw,14px)] text-emerald-100 sm:w-[min(80vw,34rem)]">
        <p className="text-[clamp(10px,1.3vw,11px)] uppercase tracking-[0.14em] text-emerald-200">MBTI Trait Breakdown</p>
        {rings.map((ring) => (
          <div key={ring.axis} className="flex items-center justify-between gap-2 rounded-full border border-emerald-200/25 bg-black/20 px-[clamp(0.55rem,1.5vw,0.75rem)] py-[clamp(0.25rem,0.8vh,0.4rem)]">
            <span className="text-[clamp(11px,1.4vw,12px)] tracking-wide text-emerald-100/90">{ring.axis}</span>
            <div className="flex items-center gap-2 text-[clamp(10px,1.35vw,12px)]">
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
  const [shareState, setShareState] = useState<ShareState>("idle");
  const [tclTransitioning, setTclTransitioning] = useState(false);
  const [reactorTransitioning, setReactorTransitioning] = useState(false);
  const [spectrumTransitioning, setSpectrumTransitioning] = useState(false);
  const [hometownTagRemoved, setHometownTagRemoved] = useState(false);
  const [pushFromBottom, setPushFromBottom] = useState(false);
  const [lockedBounce, setLockedBounce] = useState(false);
  const previousScriptRef = useRef(initialScript);
  const touchStartY = useRef<number | null>(null);
  const tclTransitionTimeoutRef = useRef<number | null>(null);
  const reactorTransitionStepTimeoutRef = useRef<number | null>(null);
  const reactorTransitionEndTimeoutRef = useRef<number | null>(null);
  const spectrumTransitionStepTimeoutRef = useRef<number | null>(null);
  const spectrumTransitionEndTimeoutRef = useRef<number | null>(null);
  const lockedBounceTimeoutRef = useRef<number | null>(null);

  const cards = script.cards;
  const currentCard = cards[index];
  const unlocked = isCardUnlocked(script, currentCard);
  const payload = (unlocked ? currentCard.data.unlocked : currentCard.data.locked || currentCard.data.unlocked) as Payload;
  const hometownSwipeRequired = currentCard.id === "hometown" && unlocked;
  const canProceedFromCurrentCard = !hometownSwipeRequired || hometownTagRemoved;
  const displayPayload = useMemo(() => {
    if (!hometownSwipeRequired || hometownTagRemoved) return payload;
    return { ...payload, value: "You need to tap the flight ticket to reveal the hometown." };
  }, [hometownSwipeRequired, hometownTagRemoved, payload]);

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

  useEffect(() => {
    if (currentCard.id !== "hometown" || !unlocked) {
      setHometownTagRemoved(false);
    }
  }, [currentCard.id, unlocked]);

  useEffect(() => {
    if (!pushFromBottom) return;
    const timeout = window.setTimeout(() => setPushFromBottom(false), 20);
    return () => window.clearTimeout(timeout);
  }, [index, pushFromBottom]);

  const triggerLockedBounce = useCallback(() => {
    setLockedBounce(true);
    if (lockedBounceTimeoutRef.current) {
      window.clearTimeout(lockedBounceTimeoutRef.current);
    }
    lockedBounceTimeoutRef.current = window.setTimeout(() => {
      setLockedBounce(false);
    }, 360);
  }, []);

  const goNext = useCallback(() => {
    if (reactorTransitioning || spectrumTransitioning) return;
    if (!unlocked) {
      triggerLockedBounce();
      return;
    }
    if (!canProceedFromCurrentCard) return;
    if (hometownSwipeRequired && index < cards.length - 1) {
      setPushFromBottom(true);
      setIndex((value) => Math.min(value + 1, cards.length - 1));
      return;
    }
    if (cards[index]?.type === "reactorSim" && index < cards.length - 1) {
      setReactorTransitioning(true);
      if (reactorTransitionStepTimeoutRef.current) {
        window.clearTimeout(reactorTransitionStepTimeoutRef.current);
      }
      if (reactorTransitionEndTimeoutRef.current) {
        window.clearTimeout(reactorTransitionEndTimeoutRef.current);
      }
      reactorTransitionStepTimeoutRef.current = window.setTimeout(() => {
        setIndex((value) => Math.min(value + 1, cards.length - 1));
      }, 420);
      reactorTransitionEndTimeoutRef.current = window.setTimeout(() => {
        setReactorTransitioning(false);
      }, 980);
      return;
    }
    if (cards[index]?.type === "constellationBuild" && cards[index + 1]?.type === "spectrumSplit") {
      setSpectrumTransitioning(true);
      if (spectrumTransitionStepTimeoutRef.current) {
        window.clearTimeout(spectrumTransitionStepTimeoutRef.current);
      }
      if (spectrumTransitionEndTimeoutRef.current) {
        window.clearTimeout(spectrumTransitionEndTimeoutRef.current);
      }
      spectrumTransitionStepTimeoutRef.current = window.setTimeout(() => {
        setIndex((value) => Math.min(value + 1, cards.length - 1));
      }, 460);
      spectrumTransitionEndTimeoutRef.current = window.setTimeout(() => {
        setSpectrumTransitioning(false);
      }, 1050);
      return;
    }
    if (cards[index]?.type === "neonFlashTransition" && index < cards.length - 1) {
      setTclTransitioning(true);
      if (tclTransitionTimeoutRef.current) {
        window.clearTimeout(tclTransitionTimeoutRef.current);
      }
      tclTransitionTimeoutRef.current = window.setTimeout(() => {
        setIndex((value) => Math.min(value + 1, cards.length - 1));
        setTclTransitioning(false);
      }, 700);
      return;
    }
    setIndex((value) => Math.min(value + 1, cards.length - 1));
  }, [canProceedFromCurrentCard, cards, hometownSwipeRequired, index, reactorTransitioning, spectrumTransitioning, triggerLockedBounce, unlocked]);

  const goBack = useCallback(() => {
    if (reactorTransitioning || spectrumTransitioning) return;
    setIndex((value) => Math.max(value - 1, 0));
  }, [reactorTransitioning, spectrumTransitioning]);

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

  // Instagram deeplink first, web fallback second.
  const handleInstagramShare = useCallback(async () => {
    const instagramDeepLink = "instagram://story-camera";
    const fallbackUrl = "https://www.instagram.com/create/story/";
    let didFallback = false;

    try {
      window.location.href = instagramDeepLink;
      window.setTimeout(() => {
        if (document.visibilityState === "visible") {
          didFallback = true;
          window.open(fallbackUrl, "_blank", "noopener,noreferrer");
          setShareState("fallback");
        }
      }, 900);
      window.setTimeout(() => {
        if (!didFallback) setShareState("opened");
      }, 400);
    } catch {
      try {
        window.open(fallbackUrl, "_blank", "noopener,noreferrer");
        setShareState("fallback");
      } catch {
        setShareState("error");
      }
    }
  }, []);

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
      if (tclTransitionTimeoutRef.current) {
        window.clearTimeout(tclTransitionTimeoutRef.current);
      }
      if (reactorTransitionStepTimeoutRef.current) {
        window.clearTimeout(reactorTransitionStepTimeoutRef.current);
      }
      if (reactorTransitionEndTimeoutRef.current) {
        window.clearTimeout(reactorTransitionEndTimeoutRef.current);
      }
      if (spectrumTransitionStepTimeoutRef.current) {
        window.clearTimeout(spectrumTransitionStepTimeoutRef.current);
      }
      if (spectrumTransitionEndTimeoutRef.current) {
        window.clearTimeout(spectrumTransitionEndTimeoutRef.current);
      }
      if (lockedBounceTimeoutRef.current) {
        window.clearTimeout(lockedBounceTimeoutRef.current);
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
      <div className="mb-4 mt-2 flex flex-col items-center">
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="h-16 w-16 rounded-full bg-emerald-500 p-0 text-black shadow-lg hover:bg-emerald-400"
          aria-label="View your match live"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
        <motion.div
          className="mt-2 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-200 sm:text-sm"
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span>Explore your match wrapped</span>
          <ArrowUp className="h-4 w-4" />
        </motion.div>
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
                <div className="pointer-events-none absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2">
                  {progressDots.map((dotId, dotIndex) => {
                    const isActive = dotIndex === index;
                    const dotCard = cards[dotIndex];
                    const isLockedDot = !!dotCard?.gate && !isCardUnlocked(script, dotCard);
                    return (
                      <motion.span
                        key={dotId}
                        className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
                          isActive ? "border-zinc-300/45 bg-zinc-300/15" : isLockedDot ? "border-amber-300/55 bg-amber-200/15" : "border-transparent bg-transparent"
                        }`}
                        animate={{ scale: isActive ? 1.05 : 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isLockedDot ? <Lock className="h-2.5 w-2.5 text-amber-200/90" /> : <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-zinc-100" : "bg-zinc-500/75"}`} />}
                      </motion.span>
                    );
                  })}
                </div>
                {currentCard.type === "blueprintDraftReveal" && <BlueprintMajorMinorBubble items={majorMinorPopularity} />}
                {currentCard.type === "reactorSim" && <ReactorMbtiOverlay mbtiDistribution={mbtiDistribution} viewerName={script.meta.viewerName} />}
                <KineticBackground type={currentCard.type} unlocked={unlocked} />
                <AnimatePresence>
                  {reactorTransitioning && (
                    <motion.div
                      className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.24),rgba(34,211,238,0.14),rgba(0,0,0,0)_68%)]"
                        animate={{ opacity: [0.2, 0.75, 0.15] }}
                        transition={{ duration: 0.9, ease: "easeInOut" }}
                      />
                      {[0, 1, 2, 3].map((ringIdx) => (
                        <motion.div
                          key={`reactor-zoom-ring-${ringIdx}`}
                          className="absolute rounded-full border"
                          style={{
                            width: 120 + ringIdx * 42,
                            height: 120 + ringIdx * 42,
                            borderColor: ["#22c55e", "#38bdf8", "#a78bfa", "#f472b6"][ringIdx] ?? "#22c55e",
                          }}
                          initial={{ scale: 0.9, opacity: 0.7 }}
                          animate={{ scale: 6.8, opacity: 0 }}
                          transition={{ duration: 0.95, ease: [0.18, 0.84, 0.35, 1], delay: ringIdx * 0.05 }}
                        />
                      ))}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-black/10 via-zinc-900/35 to-black/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.05, 0.55, 0.2] }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                      />
                    </motion.div>
                  )}
                  {spectrumTransitioning && (
                    <motion.div
                      className="pointer-events-none absolute inset-0 z-40 overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-[linear-gradient(115deg,#ef4444,#f97316,#facc15,#22c55e,#06b6d4,#3b82f6,#a855f7,#ec4899)]"
                        style={{ backgroundSize: "220% 220%" }}
                        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                        transition={{ duration: 1.2, ease: "easeInOut" }}
                      />
                      {Array.from({ length: 8 }).map((_, idx) => (
                        <motion.div
                          key={`spectrum-curtain-${idx}`}
                          className="absolute top-0 h-full"
                          style={{
                            left: `${idx * 12.5}%`,
                            width: "12.5%",
                            background: `linear-gradient(180deg, rgba(255,255,255,${0.14 + (idx % 2) * 0.08}), rgba(255,255,255,0.02))`,
                          }}
                          initial={{ y: "100%" }}
                          animate={{ y: ["100%", "0%", "-100%"] }}
                          transition={{ duration: 0.95, ease: [0.22, 0.79, 0.33, 1], delay: idx * 0.04 }}
                        />
                      ))}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/30"
                        animate={{ opacity: [0.2, 0.6, 0.25] }}
                        transition={{ duration: 1.05, ease: "easeInOut" }}
                      />
                    </motion.div>
                  )}
                  {tclTransitioning && (
                    <motion.div
                      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="text-7xl font-black tracking-[0.2em] text-transparent sm:text-9xl"
                        style={{
                          backgroundImage: "linear-gradient(135deg,#fde047,#fb7185,#38bdf8,#fde047)",
                          WebkitBackgroundClip: "text",
                          backgroundSize: "200% 200%",
                          textShadow: "0 0 25px rgba(255,255,255,0.35)",
                        }}
                        animate={{ rotate: [0, 360], scale: [0.7, 1.1, 0.85], backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
                        transition={{ duration: 0.7, ease: "easeInOut" }}
                      >
                        TCL
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.div
                  key={`${currentCard.id}-${unlocked ? "unlocked" : "locked"}`}
                  className={`relative z-10 rounded-lg p-4 backdrop-blur-[1px] ${
                    currentCard.type === "neonFlashTransition"
                      ? "bg-black/20 border border-white/25 shadow-[0_0_35px_rgba(255,255,255,0.2)]"
                      : currentCard.id === "full-reveal"
                        ? "bg-transparent border-transparent p-0 shadow-none backdrop-blur-0"
                        : "bg-black/45"
                  } ${
                    currentCard.type === "neonFlashTransition"
                      ? "absolute left-1/2 top-1/2 flex h-[72vw] max-h-[430px] w-[72vw] max-w-[430px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-3xl text-center sm:h-[58vh] sm:w-[58vh]"
                      : currentCard.type === "constellationBuild" || currentCard.type === "spectrumSplit" || currentCard.id === "match-loading"
                        ? "absolute left-1/2 top-1/2 w-[90%] max-w-[560px] -translate-x-1/2 -translate-y-1/2 text-center"
                        : ""
                  }`}
                  initial={{ opacity: 0, y: pushFromBottom ? 90 : 12, scale: 0.98 }}
                  animate={{
                    opacity:
                      (tclTransitioning && currentCard.type === "neonFlashTransition") ||
                      (reactorTransitioning && currentCard.type === "reactorSim") ||
                      (spectrumTransitioning && currentCard.type === "constellationBuild")
                        ? 0
                        : 1,
                    y:
                      lockedBounce
                        ? [0, -14, 0]
                        : spectrumTransitioning && currentCard.type === "constellationBuild"
                          ? -24
                          : spectrumTransitioning && currentCard.type === "spectrumSplit"
                            ? [18, 0]
                            : 0,
                    scale:
                      tclTransitioning && currentCard.type === "neonFlashTransition"
                        ? 1.55
                        : reactorTransitioning && currentCard.type === "reactorSim"
                          ? 1.08
                          : spectrumTransitioning && currentCard.type === "constellationBuild"
                            ? 0.86
                            : spectrumTransitioning && currentCard.type === "spectrumSplit"
                              ? [0.78, 1.03, 1]
                          : justUnlockedId === currentCard.id
                            ? [1, 1.02, 1]
                            : 1,
                    borderRadius: spectrumTransitioning && currentCard.type === "spectrumSplit" ? ["2rem", "0.75rem"] : "0.75rem",
                  }}
                  transition={{
                    duration:
                      tclTransitioning && currentCard.type === "neonFlashTransition"
                        ? 0.35
                        : spectrumTransitioning
                          ? 0.55
                          : 0.35,
                    ease: "easeInOut",
                  }}
                >
                  {currentCard.id === "full-reveal" && unlocked ? (
                    <FinalRevealStoryCard payload={displayPayload} shareState={shareState} onShare={() => void handleInstagramShare()} />
                  ) : (
                    <GenericContent payload={displayPayload} unlocked={unlocked} now={now} cardType={currentCard.type} />
                  )}
                  {hometownSwipeRequired && (
                    <HometownBaggageReveal
                      hometown={typeof payload.value === "string" ? payload.value : "Undisclosed"}
                      revealed={hometownTagRemoved}
                      onReveal={() => setHometownTagRemoved(true)}
                    />
                  )}
                  {hometownSwipeRequired && !hometownTagRemoved && <p className="mt-3 text-xs text-amber-200">You need to tap the ticket to unlock the next slide.</p>}

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
