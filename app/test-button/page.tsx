'use client';

import GameButton from '@/app/components/ui/GameButton';

export default function TestButtonPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">GameButton Test Page</h1>
          <p className="text-slate-300">Test all button variants and sizes</p>
        </div>

        {/* Color Variants */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">Color Variants</h2>
          <div className="flex flex-wrap gap-4">
            <GameButton color="blue">Blue Button</GameButton>
            <GameButton color="gold">Gold Button</GameButton>
            <GameButton color="purple">Purple Button</GameButton>
            <GameButton color="green">Green Button</GameButton>
            <GameButton color="red">Red Button</GameButton>
          </div>
        </section>

        {/* Size Variants */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">Size Variants</h2>
          <div className="flex flex-wrap items-center gap-4">
            <GameButton color="blue" size="sm">Small</GameButton>
            <GameButton color="blue" size="md">Medium (Default)</GameButton>
            <GameButton color="blue" size="lg">Large</GameButton>
          </div>
        </section>

        {/* Gold Size Variants */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">Gold Size Variants</h2>
          <div className="flex flex-wrap items-center gap-4">
            <GameButton color="gold" size="sm">Small Gold</GameButton>
            <GameButton color="gold" size="md">Medium Gold</GameButton>
            <GameButton color="gold" size="lg">Large Gold</GameButton>
          </div>
        </section>

        {/* New Colors Size Variants */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">New Colors - All Sizes</h2>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <GameButton color="purple" size="sm">Purple S</GameButton>
              <GameButton color="purple" size="md">Purple M</GameButton>
              <GameButton color="purple" size="lg">Purple L</GameButton>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <GameButton color="green" size="sm">Green S</GameButton>
              <GameButton color="green" size="md">Green M</GameButton>
              <GameButton color="green" size="lg">Green L</GameButton>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <GameButton color="red" size="sm">Red S</GameButton>
              <GameButton color="red" size="md">Red M</GameButton>
              <GameButton color="red" size="lg">Red L</GameButton>
            </div>
          </div>
        </section>

        {/* Full Width */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">Full Width</h2>
          <div className="space-y-4">
            <GameButton color="blue" fullWidth>Full Width Blue</GameButton>
            <GameButton color="gold" fullWidth>Full Width Gold</GameButton>
            <GameButton color="purple" fullWidth>Full Width Purple</GameButton>
            <GameButton color="green" fullWidth>Full Width Green</GameButton>
            <GameButton color="red" fullWidth>Full Width Red</GameButton>
          </div>
        </section>

        {/* Disabled State */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">Disabled State</h2>
          <div className="flex flex-wrap gap-4">
            <GameButton color="blue" disabled>Disabled Blue</GameButton>
            <GameButton color="gold" disabled>Disabled Gold</GameButton>
            <GameButton color="purple" disabled>Disabled Purple</GameButton>
            <GameButton color="green" disabled>Disabled Green</GameButton>
            <GameButton color="red" disabled>Disabled Red</GameButton>
          </div>
        </section>

        {/* With Href */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">With Navigation (href)</h2>
          <div className="flex flex-wrap gap-4">
            <GameButton color="blue" href="/">Go Home (Blue)</GameButton>
            <GameButton color="gold" href="/select-industry">Select Industry (Gold)</GameButton>
          </div>
        </section>

        {/* With onClick */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">With onClick Handler</h2>
          <div className="flex flex-wrap gap-4">
            <GameButton 
              color="blue" 
              onClick={() => alert('Blue button clicked!')}
            >
              Click Me (Blue)
            </GameButton>
            <GameButton 
              color="gold" 
              onClick={() => alert('Gold button clicked!')}
            >
              Click Me (Gold)
            </GameButton>
          </div>
        </section>

        {/* Custom ClassName */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">Custom Width (className)</h2>
          <div className="flex flex-wrap gap-4">
            <GameButton color="blue" className="w-full sm:w-auto">
              Responsive Width
            </GameButton>
            <GameButton color="gold" className="w-64">
              Fixed Width (256px)
            </GameButton>
          </div>
        </section>

        {/* Long Text */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">Long Text Test</h2>
          <div className="flex flex-wrap gap-4">
            <GameButton color="blue" size="sm">
              This is a very long button text to test wrapping
            </GameButton>
            <GameButton color="gold" size="lg">
              Another very long button text that should wrap nicely
            </GameButton>
          </div>
        </section>

        {/* Background Comparison */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">Background Comparison</h2>
          <div className="space-y-4">
            <div className="p-6 bg-white rounded-lg">
              <p className="text-sm text-gray-600 mb-4">White Background:</p>
              <div className="flex flex-wrap gap-4">
                <GameButton color="blue">Blue on White</GameButton>
                <GameButton color="gold">Gold on White</GameButton>
              </div>
            </div>
            <div className="p-6 bg-blue-600 rounded-lg">
              <p className="text-sm text-white mb-4">Blue Background:</p>
              <div className="flex flex-wrap gap-4">
                <GameButton color="blue">Blue on Blue</GameButton>
                <GameButton color="gold">Gold on Blue</GameButton>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

