"use client";
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
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
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm transition-opacity duration-200"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.75)" }}
      onClick={onClose}
    >
      <div
        className={`card w-full ${maxWidthClasses[maxWidth]} max-w-[90vw] max-h-[90vh] overflow-y-auto mx-4 shadow-2xl transition-all duration-200 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );

  // Use portal to render modal outside the DOM hierarchy
  // This prevents clipping and positioning issues from parent elements
  if (typeof window === 'undefined') return null;
  
  return createPortal(modalContent, document.body);
}

