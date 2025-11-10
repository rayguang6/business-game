"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useAudio } from '@/hooks/useAudio';
import "./GameButton.css";

type GameButtonProps = {
  children: React.ReactNode;
  color?: "blue" | "gold" | "purple" | "green" | "red";
  href?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
};

// Utility function for conditional class names (consistent with Card component)
function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export default function GameButton({
  children,
  color = "blue",
  href,
  onClick,
  className,
  disabled = false,
  type = "button",
  size = "md",
  fullWidth = false,
}: GameButtonProps) {
  const router = useRouter();
  const { playSoundEffect } = useAudio('none', false);

  const handleClick = () => {
    if (disabled) {
      return;
    }

    if (href) {
      // delay for press animation
      setTimeout(() => router.push(href), 120);
    } else if (onClick) {
      onClick();
    }
    playSoundEffect('buttonClick');
  };

  return (
    <button
      type={type}
      className={cn(
        "game-btn text-stroke",
        `game-btn-${color}`,
        `game-btn-${size}`,
        fullWidth && "game-btn-full",
        className
      )}
      onClick={handleClick}
      disabled={disabled}
      aria-disabled={disabled}
    >
      {children}
    </button>
  );
}
