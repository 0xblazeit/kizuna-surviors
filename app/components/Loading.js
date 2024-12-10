'use client';

import { useEffect, useState } from 'react';

export default function Loading() {
  const [blocks, setBlocks] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const totalBlocks = 10;
  const duration = 2200; // 2.20 seconds

  useEffect(() => {
    const interval = duration / totalBlocks;
    const timer = setInterval(() => {
      setBlocks(prev => prev < totalBlocks ? prev + 1 : prev);
    }, interval);

    // Keep the loading screen visible for at least 4.20 seconds
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => {
      clearInterval(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center w-screen h-screen bg-gray-900">
      <div className="w-[800px] h-[600px] bg-black border border-white flex flex-col items-center justify-center gap-4">
        <h1 className="mb-4 font-mono text-3xl text-white">loading...</h1>
        <div className="font-mono text-2xl text-white">
          <span>[</span>
          <span className="inline-block min-w-[200px] text-center">
            {'■'.repeat(blocks)}
            {'\u00A0'.repeat(totalBlocks - blocks)}
          </span>
          <span>]</span>
        </div>
      </div>
    </div>
  );
}
