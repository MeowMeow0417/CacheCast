'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  } from "@/components/ui/select"
import { Label } from '@/components/ui/label';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
} from '@/components/ui/card'
import { Input } from '@/components/ui/input';


// Generate better page request patterns
const generateRequests = (length: number) => {
  const base = Array.from({ length: Math.ceil(length / 3) }, (_, i) => (i % 10).toString());
  const requests: string[] = [];
  for (let i = 0; i < length; i++) {
    const r = Math.random();
    // here is 70% na mag match
    if (r < 0.7) {
      requests.push(base[Math.floor(Math.random() * base.length)]);
      // here is 30% new generation
    } else {
      requests.push((Math.floor(Math.random() * 10)).toString());
    }
  }
  return requests;
};

// const generateRequests = (length: number) => {
//   return Array.from({length: })
// }

// FIFO Algorithm
const buildFIFOSteps = (requests: string[], cacheSize: number) => {
  const steps = [];
  const cache: string[] = [];
  const cacheSet = new Set<string>();

  for (const page of requests) {
    const hit = cacheSet.has(page);
    let evicted: string | null = null;

    if (!hit) {
      if (cache.length >= cacheSize) {
        evicted = cache.shift()!;
        cacheSet.delete(evicted);
      }
      cache.push(page);
      cacheSet.add(page);
    }

    steps.push({ cache: [...cache], current: page, hit, evicted });
  }

  return steps;
};

// LRU Algorithm
const buildLRUSteps = (requests: string[], cacheSize: number) => {
  const steps = [];
  const cache: string[] = [];
  const lastUsed = new Map<string, number>();

  for (let i = 0; i < requests.length; i++) {
    const page = requests[i];
    const hit = cache.includes(page);
    let evicted: string | null = null;

    if (!hit) {
      if (cache.length >= cacheSize) {
        let lruPage = cache[0];
        let oldest = lastUsed.get(lruPage) ?? 0;
        for (const p of cache) {
          if ((lastUsed.get(p) ?? 0) < oldest) {
            oldest = lastUsed.get(p)!;
            lruPage = p;
          }
        }
        cache.splice(cache.indexOf(lruPage), 1);
        evicted = lruPage;
      }
      cache.push(page);
    }
    lastUsed.set(page, i);

    steps.push({ cache: [...cache], current: page, hit, evicted });
  }

  return steps;
};

// OPT Algorithm
const buildOPTSteps = (requests: string[], cacheSize: number) => {
  const steps = [];
  const cache: string[] = [];

  for (let i = 0; i < requests.length; i++) {
    const page = requests[i];
    const hit = cache.includes(page);
    let evicted: string | null = null;

    if (!hit) {
      if (cache.length >= cacheSize) {
        let farthestPage = '';
        let farthestIndex = -1;
        for (const p of cache) {
          const nextUse = requests.slice(i + 1).indexOf(p);
          if (nextUse === -1) {
            farthestPage = p;
            break;
          } else if (nextUse > farthestIndex) {
            farthestIndex = nextUse;
            farthestPage = p;
          }
        }
        cache.splice(cache.indexOf(farthestPage), 1);
        evicted = farthestPage;
      }
      cache.push(page);
    }

    steps.push({ cache: [...cache], current: page, hit, evicted });
  }

  return steps;
};

const CacheVisualizer: React.FC<{
  step: { cache: string[]; current: string; hit: boolean; evicted: string | null };
}> = ({ step }) => (
  <Card className="flex gap-2 p-6 border rounded-xl w-full justify-center flex-row">
    <AnimatePresence>
      {step.cache.map((page) => (
        <motion.div
          key={page}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-300 dark:text-black
            ${step.current === page && step.hit ? 'bg-green-300 border-green-500' :
            step.evicted === page ? 'bg-red-200 border-red-500' :
            'bg-gray-100 border-gray-300'}
          `}
        >
          {page}
        </motion.div>
      ))}
    </AnimatePresence>
  </Card>
);

const SimulationControls: React.FC<{
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  speed: number;
  setSpeed: (s: number) => void;
}> = ({ isPlaying, onPlay, onPause, onStep, onReset, speed, setSpeed }) => (
  <Card className="flex flex-col gap-4 p-6">
    <div className="flex flex-wrap gap-3 justify-center">
      <Button onClick={onStep}>Step</Button>
      <Button onClick={isPlaying ? onPause : onPlay}>{isPlaying ? 'Pause' : 'Play'}</Button>
      <Button variant="destructive" onClick={onReset}>Reset</Button>
    </div>
    <div className="flex items-center gap-2 pt-2">
      <span className="text-sm">Speed</span>
      <Slider min={0.2} max={2} step={0.1} value={[speed]} onValueChange={([val]) => setSpeed(val)} className="w-48" />
      <span className="text-sm ml-2">{speed.toFixed(1)}x</span> {/* Show the speed */}
    </div>
  </Card>
);

const StatsDashboard: React.FC<{
  totalRequests: number;
  totalHits: number;
  totalFaults: number;
}> = ({ totalRequests, totalHits, totalFaults }) => {
  const hitRate = totalRequests ? ((totalHits / totalRequests) * 100).toFixed(2) : '0.00';
  const missRate = totalRequests ? ((totalFaults / totalRequests) * 100).toFixed(2) : '0.00';

  return (
    <Card className="grid grid-cols-2 gap-4 p-4 border rounded-xlw-64 text-center">
      <div>
        <div className="text-xs">Total Requests</div>
        <div className="font-bold text-lg">{totalRequests}</div>
      </div>
      <div>
        <div className="text-xs">Page Faults</div>
        <div className="font-bold text-lg text-red-500">{totalFaults}</div>
      </div>
      <div>
        <div className="text-xs">Page Hits</div>
        <div className="font-bold text-lg text-green-500">{totalHits}</div>
      </div>
      <div>
        <div className="text-xs">Hit Rate</div>
        <div className="font-bold text-lg text-blue-500">{hitRate}%</div>
      </div>
      <div className="col-span-2">
        <div className="text-xs">Miss Rate</div>
        <div className="font-bold text-lg text-purple-500">{missRate}%</div>
      </div>
    </Card>
  );
};

const CacheSim: React.FC = () => {
  const [cacheSize, setCacheSize] = useState(3);
  const [numRequests, setNumRequests] = useState(20);
  const [requests, setRequests] = useState<string[]>([]);
  const [steps, setSteps] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [algorithm, setAlgorithm] = useState<'FIFO' | 'LRU' | 'OPT'>('FIFO');

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const runSimulation = () => {
    const reqs = generateRequests(numRequests);
    let builtSteps: any[] = [];

    if (algorithm === 'FIFO') {
      builtSteps = buildFIFOSteps(reqs, cacheSize);
    } else if (algorithm === 'LRU') {
      builtSteps = buildLRUSteps(reqs, cacheSize);
    } else if (algorithm === 'OPT') {
      builtSteps = buildOPTSteps(reqs, cacheSize);
    }

    setRequests(reqs);
    setSteps(builtSteps);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const totalRequests = currentStep + 1;
  const totalFaults = steps.slice(0, currentStep + 1).filter((s) => !s.hit).length;
  const totalHits = totalRequests - totalFaults;

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < steps.length - 1) return prev + 1;
          clearInterval(intervalRef.current!);
          setIsPlaying(false);
          return prev;
        });
      }, 1000 / speed);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => intervalRef.current && clearInterval(intervalRef.current);
  }, [isPlaying, speed, steps]);

  return (
    <section className="flex flex-col items-center justify-center p-6">
      <Label className="text-2xl font-bold mb-6">📚 Page Replacement Simulator - {algorithm}</Label>

      {/* Algorithm and Input Controls */}
      <main className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 items-center justify-center mb-8 border-2 p-4 rounded-lg shadow-lg">
        <div className="flex items-center gap-4">
          <Label className="text-sm">Algorithm:</Label>
          <Select value={algorithm} onValueChange={(val) => setAlgorithm(val as 'FIFO' | 'LRU' | 'OPT')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select an algorithm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FIFO">FIFO</SelectItem>
              <SelectItem value="LRU">LRU</SelectItem>
              <SelectItem value="OPT">OPT</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <Label className="text-sm">Cache Size:</Label>
          <Input
            type="number"
            value={cacheSize}
            min={1}
            max={20}
            onChange={(e) => setCacheSize(parseInt(e.target.value))}
            className="w-24"
          />
        </div>

        <div className="flex items-center gap-4">
          <Label className="text-sm"># of Requests:</Label>
          <Input
            type="number"
            value={numRequests}
            min={1}
            max={100}
            onChange={(e) => setNumRequests(parseInt(e.target.value))}
            className="w-24"
          />
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={runSimulation}
            className="w-48"
            disabled={cacheSize <= 0 || numRequests <= 0}
          >
            🎲 Generate Requests
          </Button>
        </div>
      </main>

      {/* Page Reference String Display */}
      {requests.length > 0 && (
        <Card className="w-full max-w-3xl mx-auto mb-8 rounded-md shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Page Reference String:</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 justify-center">
            {requests.map((page, idx) => (
              <span key={idx} className="px-2 py-1 bg-gray-100 text-sm border rounded dark:text-black">
                {page}
              </span>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Simulation Controls and Visualizer */}
      <main className=''>
        {steps.length > 0 && (
          <div className="flex flex-row items-center gap-12 w-full">
            {/* Left: Controls */}
            <div className="flex flex-col items-center gap-6 w-64">
              <SimulationControls
                isPlaying={isPlaying}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onStep={() => setCurrentStep((s) => Math.min(s + 1, steps.length - 1))}
                onReset={() => setCurrentStep(0)}
                speed={speed}
                setSpeed={setSpeed}
              />
            </div>

            {/* Middle: Visualizer */}
            <div className="flex flex-col items-center w-96">
              <Label className="text-sm text-center mb-4">
                Current Request: <strong>{steps[currentStep].current}</strong>
              </Label>
              <CacheVisualizer step={steps[currentStep]} />
            </div>

            {/* Right: Stats */}
            <StatsDashboard
              totalRequests={totalRequests}
              totalHits={totalHits}
              totalFaults={totalFaults}
            />
          </div>
        )}
      </main>

    </section>

  );
};

export default CacheSim;
