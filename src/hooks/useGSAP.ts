'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function useGSAP() {
  const scope = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ScrollTrigger: typeof import('gsap/ScrollTrigger').default;

    const initGSAP = async () => {
      const mod = await import('gsap/ScrollTrigger');
      ScrollTrigger = mod.default;
      gsap.registerPlugin(ScrollTrigger);
    };

    initGSAP();

    return () => {
      if (ScrollTrigger) {
        ScrollTrigger.getAll().forEach((t) => t.kill());
      }
    };
  }, []);

  return scope;
}

export function useScrollReveal(
  selector: string,
  options?: gsap.TweenVars,
  triggerOptions?: ScrollTrigger.Vars
) {
  useEffect(() => {
    let ctx: gsap.Context;

    const init = async () => {
      const { default: ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          gsap.from(el, {
            y: 60,
            opacity: 0,
            duration: 1,
            ease: 'power3.out',
            ...options,
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              toggleActions: 'play none none none',
              ...triggerOptions,
            },
          });
        });
      });
    };

    const timer = setTimeout(init, 100);
    return () => {
      clearTimeout(timer);
      ctx?.revert();
    };
  }, [selector, options, triggerOptions]);
}
