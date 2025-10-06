"use client";
import React from "react";
import { useRouter } from "next/navigation";
import "./GameButton.css";

type GameButtonProps = {
  children: React.ReactNode;
  color?: "blue" | "gold";
  href?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
};

export default function GameButton({
  children,
  color = "blue",
  href,
  onClick,
  className,
  disabled = false,
  type = "button",
}: GameButtonProps) {
  const router = useRouter();

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
  };

  const classes = ["game-btn", color, "text-stroke", className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      onClick={handleClick}
      disabled={disabled}
      aria-disabled={disabled}
    >
      {children}
    </button>
  );
}
