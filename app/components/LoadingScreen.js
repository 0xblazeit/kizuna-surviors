'use client';

import { useState, useEffect } from 'react';

const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);
  const [loadingBar, setLoadingBar] = useState('');

  useEffect(() => {
    const totalTime = 4000; // 4 seconds
    const interval = 100; // Update every 100ms
    const steps = totalTime / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const newProgress = Math.min((currentStep / steps) * 100, 100);
      setProgress(newProgress);

      const barLength = 20;
      const filledLength = Math.floor((newProgress / 100) * barLength);
      const bar = '[' + '='.repeat(filledLength) + ' '.repeat(barLength - filledLength) + ']';
      setLoadingBar(bar);

      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex justify-center items-center w-screen h-screen bg-gray-900">
      <div className="w-[800px] h-[600px] bg-black border border-white flex flex-col items-center justify-center">
        <div className="text-center font-vt323">
          <p className="text-4xl text-white mb-4">{loadingBar}</p>
          <p className="text-2xl text-white">{Math.round(progress)}%</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
