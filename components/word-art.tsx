"use client"

import { React, useState, useRef } from 'react'
import { motion } from "framer-motion";
import "@/app/globals.css"

export const ProWordArt = () => {
    return (
      <div className="flex items-center justify-center">
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-[7rem] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-500 to-gray-200 relative"
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
        className="relative flex items-center justify-center h-[300px] overflow-hidden"
      >
        {/* Masked light effect using text shape */}
        <div
          className="absolute z-10 h-full w-full pointer-events-none"
          style={{
            WebkitMaskImage: `text`,
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            WebkitMaskSize: "contain",
            maskComposite: "intersect", // Some browsers
          }}
        >
          {isHovering && (
            <div
              className="absolute h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.7)_0%,_transparent_70%)]"
              style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
              }}
            />
          )}
        </div>
  
        {/* Actual text as mask */}
        <h1
          className="z-20 text-[7rem] font-extrabold text-white opacity-0 pointer-events-none select-none"
          style={{
            WebkitMaskImage: "text",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            WebkitMaskSize: "contain",
          }}
        >
          Lite
        </h1>
  
        {/* Color Text */}
        <h1 className="relative z-20 text-[7rem] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-700">
          <span className="absolute left-0 top-0 text-pink-500 drop-shadow-[0_0_5px_rgba(74,20,140,0.8)]">
            Lite
          </span>
          <span className="absolute left-0 top-0 text-purple-700 drop-shadow-[0_0_15px_rgba(128,0,128,0.6)]">
            Lite
          </span>
          <span className="relative z-20">Lite</span>
        </h1>
      </div>
    )
  }