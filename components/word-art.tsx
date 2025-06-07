"use client"

import { useState, useRef } from 'react'
import { motion } from "framer-motion";
import '@/styles/globals.css'

export const ProWordArt = () => {
    return (
      <div className="flex items-center justify-center">
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-[7rem] font-extrabold text-transparent bg-clip-text bg-linear-to-r from-gray-500 to-gray-200 relative"
        >
          <span className="absolute left-0 top-0 text-[7rem] font-extrabold text-gray-500 drop-shadow-[0_0_5px_rgba(158,158,158,0.8)]">
            Pro
          </span>
          <span className="absolute left-0 top-0 text-[7rem] font-extrabold text-gray-200 drop-shadow-[0_0_15px_rgba(238,238,238,0.6)]">
            Pro
          </span>
          <span className="relative">Pro</span>
        </motion.h1>
      </div>
    );
  };

  export const LiteWordArt = () => {
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isHovering, setIsHovering] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const handleMouseMove = (e: React.MouseEvent) => {
      const bounds = containerRef.current?.getBoundingClientRect()
      if (bounds) {
        const x = e.clientX - bounds.left
        const y = e.clientY - bounds.top
        setPosition({ x, y })
      }
    }

    return (
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className="relative flex items-center justify-center"
      >
        {isHovering && (
          <div
            className="pointer-events-none absolute z-10 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.7)_0%,transparent_70%)]"
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
              mixBlendMode: "normal", // remove light blending with background
            }}
          />
        )}

        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative z-20 text-[7rem] font-extrabold text-transparent bg-clip-text bg-linear-to-r from-pink-500 to-purple-700 cursor-pointer"
        >
          <span className="absolute left-0 top-0 text-[7rem] font-extrabold text-pink-500 drop-shadow-[0_0_5px_rgba(74,20,140,0.8)]">
            Lite
          </span>
          <span className="absolute left-0 top-0 text-[7rem] font-extrabold text-purple-700 drop-shadow-[0_0_15px_rgba(128,0,128,0.6)]">
            Lite
          </span>
          <span className="relative z-20">Lite</span>
        </motion.h1>
      </div>
    )
  }
