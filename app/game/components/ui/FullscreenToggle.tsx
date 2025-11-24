"use client";

import { useEffect, useState } from "react";

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
  mozCancelFullScreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
};

const requestFullscreen = (element: FullscreenElement) => {
  if (element.requestFullscreen) {
    return element.requestFullscreen();
  }

  if (element.webkitRequestFullscreen) {
    return element.webkitRequestFullscreen();
  }

  if (element.mozRequestFullScreen) {
    return element.mozRequestFullScreen();
  }

  if (element.msRequestFullscreen) {
    return element.msRequestFullscreen();
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

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const doc = document as FullscreenDocument;
    const target = (document.getElementById(targetId) || document.documentElement) as FullscreenElement | null;

    const supported = Boolean(
      target &&
        (target.requestFullscreen ||
          target.webkitRequestFullscreen ||
          target.mozRequestFullScreen ||
          target.msRequestFullscreen)
    );
    setIsSupported(supported);
    setIsFullscreen(Boolean(doc.fullscreenElement));

    const handleChange = () => {
      setIsFullscreen(Boolean(doc.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
    };
  }, [targetId]);

  if (!isSupported) {
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

    if (doc.fullscreenElement) {
      exitFullscreen(doc);
    } else {
      requestFullscreen(target);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      className="cursor-pointer hover:bg-black/30 active:scale-95 inline-flex items-center justify-center rounded-lg border-2 border-white/30 bg-black/70 px-2.5 py-2 text-white shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-[var(--game-primary)]/50 hover:shadow-[0_0_10px_rgba(35,170,246,0.3)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-primary)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      aria-pressed={isFullscreen}
      aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
    >
      {isFullscreen ? (
        // Exit fullscreen icon (compress - arrows pointing inward)
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-white"
          aria-hidden="true"
        >
          <path
            d="M6 6L3 3M10 6L13 3M6 10L3 13M10 10L13 13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        // Enter fullscreen icon (expand - arrows pointing outward)
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-white"
          aria-hidden="true"
        >
          <path
            d="M5 3H3V5M11 3H13V5M5 13H3V11M11 13H13V11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

