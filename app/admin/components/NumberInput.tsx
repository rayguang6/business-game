'use client';

import { forwardRef } from 'react';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onWheel' | 'value'> {
  value?: number | string | null;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onChange, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="number"
        value={value ?? ''}
        onChange={onChange}
        onWheel={(e) => {
          // Prevent mouse wheel from changing the value - blur the input instead
          if (e.target instanceof HTMLElement) {
            e.target.blur();
          }
        }}
        {...props}
      />
    );
  }
);

NumberInput.displayName = 'NumberInput';