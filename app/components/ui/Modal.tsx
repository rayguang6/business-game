"use client";
import React from "react";
import { Card } from "./Card";

type ModalProps = {
  children: React.ReactNode;
  isOpen: boolean;
  onClose?: () => void;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl";
};

export function Modal({
  children,
  isOpen,
  onClose,
  className = "",
  maxWidth = "md",
}: ModalProps) {
  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
      onClick={onClose}
    >
      <div
        className={`card w-full ${maxWidthClasses[maxWidth]} max-w-[90vw] max-h-[90vh] overflow-y-auto mx-4 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

