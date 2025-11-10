"use client";
import React from "react";

type SectionHeadingProps = {
  children: React.ReactNode;
  className?: string;
};

export function SectionHeading({ children, className = "" }: SectionHeadingProps) {
  return (
    <h4 className={`section-heading ${className}`}>
      {children}
    </h4>
  );
}

