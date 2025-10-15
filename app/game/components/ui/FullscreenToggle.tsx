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
      className="cursor-pointer hover:bg-black/20 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/55 px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg backdrop-blur-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      aria-pressed={isFullscreen}
    >
      <span className="text-base leading-none" aria-hidden="true">
        {isFullscreen ? "⤡" : "⤢"}
      </span>
    </button>
  );
}

