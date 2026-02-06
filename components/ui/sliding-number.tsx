"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "~/lib/utils";

type AnimationProfile = 'auto' | 'fast' | 'medium' | 'slow';
type EasingFunction = 'easeOutExpo' | 'easeOutCubic' | 'easeOutQuad' | 'linear';

interface SlidingNumberProps {
  value: number;
  className?: string;
  format?: (value: number) => string;
  duration?: number;
  delay?: number;
  animateOnMount?: boolean;
  animationProfile?: AnimationProfile;
  easing?: EasingFunction;
}

function getOptimalDuration(value: number, profile: AnimationProfile): number {
  if (profile !== 'auto') {
    const durations = { fast: 500, medium: 1000, slow: 2000 };
    return durations[profile] || 1000;
  }
  const magnitude = Math.abs(value);
  if (magnitude < 10) return 400;
  if (magnitude < 100) return 600;
  if (magnitude < 1000) return 800;
  return 1000;
}

const easingFunctions = {
  easeOutExpo: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeOutQuad: (t: number) => 1 - (1 - t) * (1 - t),
  linear: (t: number) => t,
};

export function SlidingNumber({
  value,
  className,
  format = (val) => val.toString(),
  duration,
  delay = 0,
  animateOnMount = true,
  animationProfile = 'auto',
  easing = 'easeOutExpo'
}: SlidingNumberProps) {
  const [hasAnimated, setHasAnimated] = useState(false);
  const previousValue = useRef<number>(0);
  const currentValue = useRef<number>(0);
  const animationRef = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const shouldAnimate = animateOnMount && !hasAnimated;
    if (!shouldAnimate && previousValue.current === value) return;

    const startValue = shouldAnimate ? 0 : currentValue.current;
    const endValue = value;
    const startTime = Date.now() + delay;
    const animDuration = duration || getOptimalDuration(value, animationProfile);
    const easingFn = easingFunctions[easing];

    const animate = () => {
      const now = Date.now();
      const elapsed = Math.max(0, now - startTime);
      const progress = Math.min(elapsed / animDuration, 1);
      const easedProgress = easingFn(progress);

      currentValue.current = startValue + (endValue - startValue) * easedProgress;

      if (containerRef.current) {
        containerRef.current.textContent = format(Math.round(currentValue.current));
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = value;
        if (shouldAnimate) setHasAnimated(true);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [value, duration, delay, format, animateOnMount, hasAnimated, animationProfile, easing]);

  return (
    <span ref={containerRef} className={cn("tabular-nums", className)}>
      {format(animateOnMount && !hasAnimated ? 0 : value)}
    </span>
  );
}
