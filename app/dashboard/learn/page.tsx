'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const cities = ['Tokyo', 'Paris', 'Rome', 'London', 'Berlin', 'Bangkok', 'Manila', 'Seoul', 'Oslo', 'Beijing'];

const generateRequests = (length: number) => {
  return Array.from({ length }, () => cities[Math.floor(Math.random() * cities.length)]);
};

const buildFIFOSteps = (requests: string[], cacheSize: number) => {
    const steps = [];
    const cache: string[] = [];

    for (const city of requests) {
      const hit = cache.includes(city); // ⚠️ O(n) lookup; consider using a Set for faster hit checks
      let evicted: string | null = null;

      if (!hit) {
        if (cache.length >= cacheSize) {
          evicted = cache.shift()!;
        }
        cache.push(city);
      }

      steps.push({ cache: [...cache], current: city, hit, evicted }); // ✔️ clean copy of cache state
    }

    return steps;
  };


const CacheVisualizer: React.FC<{
  step: { cache: string[]; current: string; hit: boolean; evicted: string | null };
}> = ({ step }) => {
  return (
    <div className="flex gap-2 p-4 border rounded-xl w-full justify-center">
      <AnimatePresence>
        {step.cache.map((city) => (
          <motion.div
            key={city}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-300
              ${step.current === city && step.hit ? 'bg-green-300 border-green-500' :
              step.evicted === city ? 'bg-red-200 border-red-500' :
              'bg-gray-100 border-gray-300'}
            `}
          >
            {city}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const SimulationControls: React.FC<{
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  speed: number;
  setSpeed: (s: number) => void;
}> = ({ isPlaying, onPlay, onPause, onStep, onReset, speed, setSpeed }) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-4">
        <Button onClick={onStep}>Step</Button>
        <Button onClick={isPlaying ? onPause : onPlay}>{isPlaying ? 'Pause' : 'Play'}</Button>
        <Button variant="destructive" onClick={onReset}>Reset</Button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm">Speed</span>
            <Slider min={0.2} max={2} step={0.1} value={[speed]} onValueChange={([val]) => setSpeed(val)} className="w-48" />
      </div>
    </div>
  );
};

const CacheSim: React.FC = () => {
  const [cacheSize, setCacheSize] = useState(3);
  const [requests, setRequests] = useState<string[]>([]);
  const [steps, setSteps] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const runSimulation = () => {
    const reqs = generateRequests(20);
    setRequests(reqs);
    setSteps(buildFIFOSteps(reqs, cacheSize));
    setCurrentStep(0);
    setIsPlaying(false);
  };

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < steps.length - 1) return prev + 1;
          setIsPlaying(false); // ⚠️ Could lead to extra renders; refactor to stop interval instead
          return prev;
        });
      }, 1000 / speed);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current); // ⚠️ Clear interval early if simulation ends
    }
    return () => intervalRef.current && clearInterval(intervalRef.current);
  }, [isPlaying, speed, steps]);


  return (
    <section className="flex flex-col items-center justify-center min-h-screen p-6 gap-6">
      <Button onClick={runSimulation}>🎲 Generate Requests</Button>
      {steps.length > 0 && (
        <>
          <div className="text-sm">Current Request: <strong>{steps[currentStep].current}</strong></div>
          <CacheVisualizer step={steps[currentStep]} />
          <SimulationControls
            isPlaying={isPlaying}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onStep={() => setCurrentStep((s) => Math.min(s + 1, steps.length - 1))}
            onReset={() => setCurrentStep(0)}
            speed={speed}
            setSpeed={setSpeed}
          />
        </>
      )}
    </section>
  );
};

export default CacheSim;
