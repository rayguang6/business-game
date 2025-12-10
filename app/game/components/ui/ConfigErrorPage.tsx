'use client';

import { useRouter } from 'next/navigation';
import GameButton from '@/app/components/ui/GameButton';

export type ErrorType = 'database' | 'code' | 'unknown';

interface ConfigErrorPageProps {
  title: string;
  message: string;
  details?: string;
  errorType?: ErrorType;
  error?: Error | unknown;
  showRetry?: boolean;
}

function getErrorType(error: unknown): ErrorType {
  if (!error) return 'unknown';
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Database errors typically mention database, config, admin panel, or missing data
  if (
    errorMessage.includes('database') ||
    errorMessage.includes('config') ||
    errorMessage.includes('admin panel') ||
    errorMessage.includes('not found') ||
    errorMessage.includes('not loaded') ||
    errorMessage.includes('not configured') ||
    errorMessage.includes('missing')
  ) {
    return 'database';
  }
  
  // Code errors typically mention null, undefined, or property access
  if (
    errorMessage.includes('Cannot read') ||
    errorMessage.includes('null') ||
    errorMessage.includes('undefined') ||
    errorMessage.includes('property')
  ) {
    return 'code';
  }
  
  return 'unknown';
}

function getErrorDetails(error: unknown, errorType: ErrorType): string {
  if (process.env.NODE_ENV === 'development') {
    // In dev mode, show full error details
    if (error instanceof Error) {
      return `${error.message}\n\nStack:\n${error.stack}`;
    }
    return String(error);
  }
  
  // In production, show user-friendly messages
  if (errorType === 'database') {
    return 'This usually means the industry configuration is missing or incomplete. Please check the admin panel.';
  }
  
  if (errorType === 'code') {
    return 'This indicates a programming error. Please report this issue to the development team.';
  }
  
  return 'An unexpected error occurred. Please try refreshing the page.';
}

export function ConfigErrorPage({
  title,
  message,
  details,
  errorType: providedErrorType,
  error,
  showRetry = false
}: ConfigErrorPageProps) {
  const router = useRouter();
  const errorType = providedErrorType || (error ? getErrorType(error) : 'unknown');
  const errorDetails = error ? getErrorDetails(error, errorType) : details;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-900 text-white text-center px-6">
      <div className="text-6xl mb-4">
        {errorType === 'database' ? '🗄️' : errorType === 'code' ? '🐛' : '⚠️'}
      </div>
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-lg max-w-2xl text-gray-300">{message}</p>
      
      {errorType === 'database' && (
        <div className="mt-2 p-3 bg-blue-900/30 rounded-lg max-w-2xl border border-blue-700">
          <p className="text-sm text-blue-200">
            💡 <strong>Database Issue:</strong> This industry needs to be configured in the admin panel.
          </p>
        </div>
      )}
      
      {errorType === 'code' && (
        <div className="mt-2 p-3 bg-red-900/30 rounded-lg max-w-2xl border border-red-700">
          <p className="text-sm text-red-200">
            ⚠️ <strong>Code Error:</strong> This is a programming issue. Please report it.
          </p>
        </div>
      )}
      
      {errorDetails && (
        <div className="mt-4 p-4 bg-gray-800 rounded-lg max-w-2xl text-left">
          <p className="text-sm text-gray-400 font-mono whitespace-pre-wrap break-words">
            {errorDetails}
          </p>
        </div>
      )}
      
      <div className="flex gap-4 mt-4">
        {showRetry && (
          <GameButton onClick={() => window.location.reload()} color="blue">
            Try Again
          </GameButton>
        )}
        <GameButton onClick={() => router.push('/select-industry')} color="gold">
          Back to Industry Selection
        </GameButton>
      </div>
    </div>
  );
}

