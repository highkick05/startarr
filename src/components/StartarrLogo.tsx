import React, { useState, useEffect, useCallback, useRef } from 'react';

interface StartarrLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  replayOnHover?: boolean;
}

export const StartarrLogo: React.FC<StartarrLogoProps> = ({
  className = '',
  size = 'md',
  replayOnHover = true,
}) => {
  const fullStart = 'Start';
  const [typedStart, setTypedStart] = useState('');
  const [showArr, setShowArr] = useState(false);
  const [isTyping, setIsTyping] = useState(true);
  const isRunningRef = useRef(false);

  const runAnimation = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    setTypedStart('');
    setShowArr(false);
    setIsTyping(true);

    let currentIndex = 0;
    // Initial short pause before terminal typing begins
    const startDelay = setTimeout(() => {
      const typeInterval = setInterval(() => {
        currentIndex++;
        setTypedStart(fullStart.slice(0, currentIndex));

        if (currentIndex >= fullStart.length) {
          clearInterval(typeInterval);
          setIsTyping(false);
          // The remainder "arr" appears normally right after "Start" is typed
          setTimeout(() => {
            setShowArr(true);
            isRunningRef.current = false;
          }, 100);
        }
      }, 95);
    }, 200);

    return () => {
      clearTimeout(startDelay);
      isRunningRef.current = false;
    };
  }, []);

  useEffect(() => {
    const cleanup = runAnimation();
    return cleanup;
  }, [runAnimation]);

  // Sizing scale
  const sizeClasses = {
    sm: 'text-sm sm:text-base py-1 px-2.5',
    md: 'text-lg sm:text-2xl py-1.5 px-3.5',
    lg: 'text-2xl sm:text-4xl py-2 px-5',
  }[size];

  return (
    <div
      onClick={!isTyping ? runAnimation : undefined}
      onMouseEnter={replayOnHover && !isTyping ? runAnimation : undefined}
      className={`inline-flex items-center select-none cursor-pointer group tracking-normal transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] ${className}`}
      title="Click to replay animation"
      style={{
        fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      }}
    >
      {/* Sleek black badge container matching screenshot background & glow */}
      <div
        className={`relative flex items-center rounded-xl bg-black/85 backdrop-blur-md border border-neutral-900 group-hover:border-emerald-500/30 shadow-2xl shadow-black/80 transition-all duration-300 ${sizeClasses}`}
      >
        {/* Soft emerald atmospheric ambient glow behind the logo */}
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/15 via-emerald-400/10 to-transparent rounded-2xl blur-md pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />

        <div className="relative flex items-center leading-none">
          {/* "Start" typed out in glowing terminal neon green */}
          <span
            className="text-[#2ef871] font-bold tracking-tight"
            style={{
              textShadow:
                '0 0 6px rgba(46, 248, 113, 0.95), 0 0 14px rgba(46, 248, 113, 0.65), 0 0 24px rgba(46, 248, 113, 0.35)',
              filter: 'drop-shadow(0 0 3px rgba(46, 248, 113, 0.8))',
            }}
          >
            {typedStart}
          </span>

          {/* Glowing neon terminal cursor divider "|" */}
          <span
            className={`font-bold text-[#2ef871] mx-[0.5px] transition-all duration-150 ${
              isTyping ? 'animate-pulse' : ''
            }`}
            style={{
              textShadow:
                '0 0 8px rgba(46, 248, 113, 1), 0 0 16px rgba(46, 248, 113, 0.75), 0 0 26px rgba(46, 248, 113, 0.4)',
              filter: 'drop-shadow(0 0 4px rgba(46, 248, 113, 0.9))',
            }}
          >
            |
          </span>

          {/* "arr" appearing normally in crisp white text */}
          <span
            className={`text-white font-bold tracking-tight transition-opacity duration-150 ${
              showArr ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              textShadow: '0 0 2px rgba(255, 255, 255, 0.4), 0 2px 4px rgba(0, 0, 0, 0.8)',
            }}
          >
            arr
          </span>
        </div>
      </div>
    </div>
  );
};
