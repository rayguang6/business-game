"use client";
import React from "react";
import { useRouter } from "next/navigation";
import "./GameButton.css";

type GameButtonProps = {
  children: React.ReactNode;
  color?: "blue" | "gold";
  href?: string;
  onClick?: () => void;
};

export default function GameButton({ children, color = "blue", href, onClick }: GameButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      // delay for press animation
      setTimeout(() => router.push(href), 120);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <button className={`game-btn ${color} text-stroke`} onClick={handleClick}>
      {children}
    </button>
  );
}
