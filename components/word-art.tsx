"use client"

import React from "react";
import { motion } from "framer-motion";

const LiteWordArt = () => {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-[8rem] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 relative"
        >
          <span className="absolute left-0 top-0 text-[8rem] font-extrabold text-pink-500 drop-shadow-[0_0_5px_rgba(255,105,180,0.8)]">
            Lite
          </span>
          <span className="absolute left-0 top-0 text-[8rem] font-extrabold text-purple-500 drop-shadow-[0_0_15px_rgba(128,0,128,0.6)]">
            Lite
          </span>
          <span className="relative">Lite</span>
        </motion.h1>
      </div>
    );
  };

export default LiteWordArt;