"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type FullscreenToggleProps = {
  targetId: string;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  mozRequestFullScreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenElement?: Element | null;
  mozCancelFullScreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
};

const requestFullscreen = async (element: FullscreenElement): Promise<void> => {
  if (element.requestFullscreen) {
    return element.requestFullscreen();
  }

  if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
    return Promise.resolve();
  }

  if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
    return Promise.resolve();
  }

  if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
    return Promise.resolve();
  }

  return Promise.resolve();
};

const exitFullscreen = (doc: FullscreenDocument) => {
  if (doc.exitFullscreen) {
    return doc.exitFullscreen();
  }

  if (doc.webkitExitFullscreen) {
    return doc.webkitExitFullscreen();
  }

  if (doc.mozCancelFullScreen) {
    return doc.mozCancelFullScreen();
  }

  if (doc.msExitFullscreen) {
    return doc.msExitFullscreen();
  }

  return Promise.resolve();
};

export function FullscreenToggle({ targetId }: FullscreenToggleProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const doc = document as FullscreenDocument;
    const target = (document.getElementById(targetId) || document.documentElement) as FullscreenElement | null;

    // Enhanced fullscreen support detection for mobile devices
    // Note: iOS Safari only supports fullscreen on video elements, not arbitrary elements
    const detectedIsIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(detectedIsIOS);

    const supported = Boolean(
      target &&
        !detectedIsIOS && // iOS Safari doesn't support fullscreen on non-video elements
        (target.requestFullscreen ||
          target.webkitRequestFullscreen ||
          target.mozRequestFullScreen ||
          target.msRequestFullscreen ||
          // General webkit support check
          (typeof document !== "undefined" && 'webkitFullscreenEnabled' in document && document.webkitFullscreenEnabled))
    );
    setIsSupported(supported);
    setIsFullscreen(Boolean(doc.fullscreenElement || doc.webkitFullscreenElement));

    const handleChange = () => {
      setIsFullscreen(Boolean(doc.fullscreenElement || doc.webkitFullscreenElement));
    };

    // Add all possible fullscreen change event listeners
    document.addEventListener("fullscreenchange", handleChange);
    document.addEventListener("webkitfullscreenchange", handleChange);
    document.addEventListener("mozfullscreenchange", handleChange);
    document.addEventListener("MSFullscreenChange", handleChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      document.removeEventListener("webkitfullscreenchange", handleChange);
      document.removeEventListener("mozfullscreenchange", handleChange);
      document.removeEventListener("MSFullscreenChange", handleChange);
    };
  }, [targetId]);

  // Show button on all devices - iOS will show it but fullscreen may not work
  // This allows users to discover the functionality even if it's limited on iOS
  if (!isSupported && !isIOS) {
    return null;
  }

  const toggleFullscreen = () => {
    if (typeof document === "undefined") {
      return;
    }

    const doc = document as FullscreenDocument;
    const target = (document.getElementById(targetId) || document.documentElement) as FullscreenElement | null;

    if (!target) {
      return;
    }

    // Check if already in fullscreen (including webkit)
    const isCurrentlyFullscreen = Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);

    if (isCurrentlyFullscreen) {
      exitFullscreen(doc);
    } else {
      // iOS Safari requires user gesture, so we try the request
      requestFullscreen(target).catch((error: any) => {
        console.warn('Fullscreen request failed:', error);
        // On iOS, fullscreen might not work but we can try to maximize viewport
        if (isIOS) {
          // Try to scroll to top and maximize viewport as fallback
          window.scrollTo(0, 0);
          // iOS Safari doesn't support programmatic fullscreen for web apps
          // but we can at least try the standard request
        }
      });
    }
  };

  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      className="cursor-pointer hover:bg-black/30 active:scale-95 inline-flex items-center justify-center rounded-lg border-2 border-white/40 bg-black/80 px-1 py-1 sm:px-1 sm:py-1 text-white shadow-xl backdrop-blur-sm transition-all duration-200 hover:border-[var(--game-primary)]/60 hover:shadow-[0_0_15px_rgba(35,170,246,0.4)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-primary)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black min-w-[44px] min-h-[44px]"
      aria-pressed={isFullscreen}
      aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
    >
      <Image
        src={isFullscreen ? "/images/icons/exit-fullscreen.png" : "/images/icons/enter-fullscreen.png"}
        alt={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        width="50"
        height="50"
        className="w-10 h-10"
      />
    </button>
  );
}

