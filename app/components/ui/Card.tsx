"use client";
import React from "react";

type CardProps = {
  children: React.ReactNode;
  variant?: "default" | "success" | "error" | "warning" | "info";
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
};

function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function Card({
  children,
  variant = "default",
  interactive = false,
  className,
  onClick,
  style,
}: CardProps) {
  const baseClasses = "card";
  const variantClasses = {
    default: "",
    success: "card-success",
    error: "card-error",
    warning: "card-warning",
    info: "card-info",
  };
  const interactiveClass = interactive ? "card-interactive" : "";

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        interactiveClass,
        className
      )}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
}

