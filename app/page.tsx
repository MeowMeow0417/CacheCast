'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';

const HomeRedirectPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<number>(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 15;
        return next >= 100 ? 100 : next;
      });
    }, 200); // smooth progress animation

    const timeout = setTimeout(() => {
      setLoading(false);
      router.push('/dashboard');
    }, 3000); // redirect after 3s

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <main className="flex items-center justify-center h-screen">
      {loading && (
        <div className="text-center space-y-4 w-[300px]">
          <h1 className="text-xl font-semibold animate-pulse">
            Loading Cache Simulator...
          </h1>
          <Progress value={progress} className="w-full mx-auto transition-all duration-300 ease-in-out" />
        </div>
      )}
    </main>
  );
};

export default HomeRedirectPage;