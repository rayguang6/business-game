"use client";
import React from "react";
import "./GameCard.css";

type GameCardProps = {
  children: React.ReactNode;
  color?: "blue" | "gold" | "purple" | "green" | "red";
  variant?: "default" | "outlined" | "elevated";
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
};

// Utility function for conditional class names
function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export default function GameCard({
  children,
  color = "blue",
  variant = "default",
  size = "md",
  interactive = false,
  className,
  onClick,
  style,
}: GameCardProps) {
  return (
    <div
      className={cn(
        "game-card",
        `game-card-${color}`,
        `game-card-${variant}`,
        `game-card-${size}`,
        interactive && "game-card-interactive",
        className
      )}
      onClick={onClick}
      style={style}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      {children}
    </div>
  );
}

