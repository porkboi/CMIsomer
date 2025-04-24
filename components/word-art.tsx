"use client"

import React from "react";
import { motion } from "framer-motion";
import "./globals.css"

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
    return (
      <div className="flex items-center justify-center">
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="lite-word relative text-[7rem] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-700 cursor-pointer"
        >
          <span className="absolute left-0 top-0 text-[7rem] font-extrabold text-pink-500 drop-shadow-[0_0_5px_rgba(255,105,180,0.8)]">
            Lite
          </span>
          <span className="absolute left-0 top-0 text-[7rem] font-extrabold text-purple-700 drop-shadow-[0_0_15px_rgba(128,0,128,0.6)]">
            Lite
          </span>
          <span className="relative z-10">Lite</span>
        </motion.h1>
      </div>
    )
  }
