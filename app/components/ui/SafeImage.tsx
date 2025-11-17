'use client';

import Image from 'next/image';
import { normalizeImageUrl, isExternalUrl } from '@/lib/utils/imageUtils';
import { useState } from 'react';

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fallback?: React.ReactNode;
  onError?: () => void;
}

/**
 * SafeImage component that handles both local and external image URLs
 * Automatically handles Next.js Image optimization for external URLs
 */
export function SafeImage({
  src,
  alt,
  width,
  height,
  fill,
  className,
  sizes,
  priority,
  fallback,
  onError,
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  const normalizedSrc = normalizeImageUrl(src);
  const isExternal = isExternalUrl(normalizedSrc);

  // If no src or error occurred, show fallback
  if (!normalizedSrc || hasError) {
    return fallback ? <>{fallback}</> : null;
  }

  // For external URLs, Next.js Image will handle them with the configured remotePatterns
  // For local paths, Next.js Image will optimize them normally
  const imageProps = {
    src: normalizedSrc,
    alt,
    className,
    sizes,
    priority,
    onError: () => {
      setHasError(true);
      onError?.();
    },
    // For external URLs, you might want to use unoptimized if Next.js optimization fails
    // But with proper remotePatterns config, it should work fine
    ...(fill ? { fill: true } : { width, height }),
  };

  return <Image {...imageProps} />;
}

