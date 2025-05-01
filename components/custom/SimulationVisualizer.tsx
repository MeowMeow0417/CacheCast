'use client';

import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';

interface SimulationVisualizerProps {
  requests: string[];
  cacheSize: number;
  algorithm: 'FIFO' | 'LRU' | 'OPT';
}

const simulate = (
  algo: 'FIFO' | 'LRU' | 'OPT',
  requests: string[],
  cacheSize: number,
  onStep: (cache: string[], current: string, hit: boolean) => void
) => {
  const cache: string[] = [];
  const future = [...requests];

  for (let i = 0; i < requests.length; i++) {
    const city = requests[i];
    const hit = cache.includes(city);
    onStep([...cache], city, hit);

    if (hit) {
      if (algo === 'LRU') {
        const index = cache.indexOf(city);
        cache.splice(index, 1);
        cache.push(city);
      }
    } else {
      if (cache.length < cacheSize) {
        cache.push(city);
      } else {
        if (algo === 'FIFO') {
          cache.shift();
        } else if (algo === 'LRU') {
          cache.shift();
        } else if (algo === 'OPT') {
          let farthestIndex = -1;
          let cityToRemove = cache[0];

          for (const cachedCity of cache) {
            const nextUse = future.slice(i + 1).indexOf(cachedCity);
            if (nextUse === -1) {
              cityToRemove = cachedCity;
              break;
            }
            if (nextUse > farthestIndex) {
              farthestIndex = nextUse;
              cityToRemove = cachedCity;
            }
          }

          const removeIndex = cache.indexOf(cityToRemove);
          if (removeIndex !== -1) cache.splice(removeIndex, 1);
        }

        cache.push(city);
      }
    }
  }
};

export const SimulationVisualizer: React.FC<SimulationVisualizerProps> = ({
  requests,
  cacheSize,
  algorithm,
}) => {
  const [cache, setCache] = useState<string[]>([]);
  const [current, setCurrent] = useState('');
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    let i = 0;
    const run = () => {
      simulate(algorithm, requests, cacheSize, (newCache, currentReq) => {
        setTimeout(() => {
          setCache(newCache);
          setCurrent(currentReq);
          setStepIndex(i);
          i++;
        }, i * 600); // speed
      });
    };

    run();
  }, [requests, cacheSize, algorithm]);

  return (
    <div className="mt-4 w-full">
      <h3 className="text-lg font-semibold mb-2">{algorithm} Simulation</h3>
      <div className="flex space-x-2">
        {cache.map((city, idx) => (
          <motion.div
            key={city + idx}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-2 px-4 rounded bg-blue-100 text-blue-800 font-medium shadow ${
              city === current ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            {city}
          </motion.div>
        ))}
      </div>
      <p className="text-sm mt-2 text-muted-foreground">Step {stepIndex + 1} / {requests.length} — Requesting <strong>{current}</strong></p>
    </div>
  );
};
