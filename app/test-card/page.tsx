'use client';

import GameCard from '@/app/components/ui/GameCard';

export default function TestCardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">GameCard Test Page</h1>
          <p className="text-slate-300">Test all card variants, colors, and sizes</p>
        </div>

        {/* Color Variants - Default */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">Color Variants (Default)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <GameCard color="blue">
              <h3 className="font-bold text-lg mb-2">Blue Card</h3>
              <p className="text-sm opacity-90">This is a blue card with default styling.</p>
            </GameCard>
            <GameCard color="gold">
              <h3 className="font-bold text-lg mb-2">Gold Card</h3>
              <p className="text-sm opacity-90">This is a gold card with default styling.</p>
            </GameCard>
            <GameCard color="purple">
              <h3 className="font-bold text-lg mb-2">Purple Card</h3>
              <p className="text-sm opacity-90">This is a purple card with default styling.</p>
            </GameCard>
            <GameCard color="green">
              <h3 className="font-bold text-lg mb-2">Green Card</h3>
              <p className="text-sm opacity-90">This is a green card with default styling.</p>
            </GameCard>
            <GameCard color="red">
              <h3 className="font-bold text-lg mb-2">Red Card</h3>
              <p className="text-sm opacity-90">This is a red card with default styling.</p>
            </GameCard>
          </div>
        </section>

        {/* Size Variants */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">Size Variants</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GameCard color="blue" size="sm">
              <h3 className="font-bold mb-2">Small Card</h3>
              <p className="text-xs opacity-90">Small size variant with less padding.</p>
            </GameCard>
            <GameCard color="blue" size="md">
              <h3 className="font-bold mb-2">Medium Card (Default)</h3>
              <p className="text-sm opacity-90">Medium size variant with default padding.</p>
            </GameCard>
            <GameCard color="blue" size="lg">
              <h3 className="font-bold text-lg mb-2">Large Card</h3>
              <p className="text-base opacity-90">Large size variant with more padding.</p>
            </GameCard>
          </div>
        </section>

        {/* Variant Styles */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">Variant Styles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GameCard color="blue" variant="default">
              <h3 className="font-bold mb-2">Default</h3>
              <p className="text-sm opacity-90">Solid background with gradient.</p>
            </GameCard>
            <GameCard color="blue" variant="outlined">
              <h3 className="font-bold mb-2">Outlined</h3>
              <p className="text-sm opacity-90">Transparent background with colored border.</p>
            </GameCard>
            <GameCard color="blue" variant="elevated">
              <h3 className="font-bold mb-2">Elevated</h3>
              <p className="text-sm opacity-90">Default style with enhanced shadow.</p>
            </GameCard>
          </div>
        </section>

        {/* All Colors - Outlined Variant */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">All Colors - Outlined Variant</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <GameCard color="blue" variant="outlined">
              <h3 className="font-bold mb-2">Blue</h3>
              <p className="text-xs opacity-90">Outlined</p>
            </GameCard>
            <GameCard color="gold" variant="outlined">
              <h3 className="font-bold mb-2">Gold</h3>
              <p className="text-xs opacity-90">Outlined</p>
            </GameCard>
            <GameCard color="purple" variant="outlined">
              <h3 className="font-bold mb-2">Purple</h3>
              <p className="text-xs opacity-90">Outlined</p>
            </GameCard>
            <GameCard color="green" variant="outlined">
              <h3 className="font-bold mb-2">Green</h3>
              <p className="text-xs opacity-90">Outlined</p>
            </GameCard>
            <GameCard color="red" variant="outlined">
              <h3 className="font-bold mb-2">Red</h3>
              <p className="text-xs opacity-90">Outlined</p>
            </GameCard>
          </div>
        </section>

        {/* Interactive Cards */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">Interactive Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <GameCard 
              color="blue" 
              interactive 
              onClick={() => alert('Blue card clicked!')}
            >
              <h3 className="font-bold mb-2">Clickable Blue</h3>
              <p className="text-sm opacity-90">Hover and click to test interaction.</p>
            </GameCard>
            <GameCard 
              color="gold" 
              interactive 
              onClick={() => alert('Gold card clicked!')}
            >
              <h3 className="font-bold mb-2">Clickable Gold</h3>
              <p className="text-sm opacity-90">Hover and click to test interaction.</p>
            </GameCard>
            <GameCard 
              color="purple" 
              interactive 
              onClick={() => alert('Purple card clicked!')}
            >
              <h3 className="font-bold mb-2">Clickable Purple</h3>
              <p className="text-sm opacity-90">Hover and click to test interaction.</p>
            </GameCard>
          </div>
        </section>

        {/* Size Combinations */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">Size Combinations</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GameCard color="green" size="sm">
                <h3 className="font-bold mb-1">Small Green</h3>
                <p className="text-xs opacity-90">Compact card</p>
              </GameCard>
              <GameCard color="green" size="md">
                <h3 className="font-bold mb-2">Medium Green</h3>
                <p className="text-sm opacity-90">Standard card</p>
              </GameCard>
              <GameCard color="green" size="lg">
                <h3 className="font-bold text-lg mb-2">Large Green</h3>
                <p className="text-base opacity-90">Spacious card</p>
              </GameCard>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GameCard color="red" size="sm" variant="outlined">
                <h3 className="font-bold mb-1">Small Red</h3>
                <p className="text-xs opacity-90">Outlined</p>
              </GameCard>
              <GameCard color="red" size="md" variant="outlined">
                <h3 className="font-bold mb-2">Medium Red</h3>
                <p className="text-sm opacity-90">Outlined</p>
              </GameCard>
              <GameCard color="red" size="lg" variant="outlined">
                <h3 className="font-bold text-lg mb-2">Large Red</h3>
                <p className="text-base opacity-90">Outlined</p>
              </GameCard>
            </div>
          </div>
        </section>

        {/* Long Content */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">Long Content Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GameCard color="blue">
              <h3 className="font-bold text-lg mb-3">Card with Long Content</h3>
              <p className="text-sm opacity-90 mb-3">
                This is a longer paragraph to test how the card handles extended content. 
                The card should maintain its styling and readability even with more text.
              </p>
              <p className="text-sm opacity-90">
                Multiple paragraphs should also work well within the card component, 
                allowing for rich content display while maintaining the design system aesthetics.
              </p>
            </GameCard>
            <GameCard color="purple" variant="outlined">
              <h3 className="font-bold text-lg mb-3">Outlined with Long Content</h3>
              <p className="text-sm opacity-90 mb-3">
                This outlined card also handles long content gracefully. The transparent 
                background works well with various content lengths.
              </p>
              <ul className="text-sm opacity-90 list-disc list-inside space-y-1">
                <li>List item one</li>
                <li>List item two</li>
                <li>List item three</li>
              </ul>
            </GameCard>
          </div>
        </section>

        {/* Background Comparison */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">Background Comparison</h2>
          <div className="space-y-4">
            <div className="p-6 bg-white rounded-lg">
              <p className="text-sm text-gray-600 mb-4">White Background:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GameCard color="blue">
                  <h3 className="font-bold mb-2">Blue Card</h3>
                  <p className="text-sm opacity-90">On white background</p>
                </GameCard>
                <GameCard color="gold">
                  <h3 className="font-bold mb-2">Gold Card</h3>
                  <p className="text-sm opacity-90">On white background</p>
                </GameCard>
              </div>
            </div>
            <div className="p-6 bg-slate-700 rounded-lg">
              <p className="text-sm text-white mb-4">Dark Background:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GameCard color="blue" variant="outlined">
                  <h3 className="font-bold mb-2">Outlined Blue</h3>
                  <p className="text-sm opacity-90">On dark background</p>
                </GameCard>
                <GameCard color="gold" variant="outlined">
                  <h3 className="font-bold mb-2">Outlined Gold</h3>
                  <p className="text-sm opacity-90">On dark background</p>
                </GameCard>
              </div>
            </div>
          </div>
        </section>

        {/* Custom Content Examples */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">Custom Content Examples</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <GameCard color="blue" interactive onClick={() => alert('Stats card clicked!')}>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">$12,450</div>
                <div className="text-sm opacity-90">Total Revenue</div>
              </div>
            </GameCard>
            <GameCard color="green" variant="elevated">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold mb-1">Customers</div>
                  <div className="text-2xl font-bold">24</div>
                </div>
                <div className="text-3xl">👥</div>
              </div>
            </GameCard>
            <GameCard color="purple" variant="outlined" size="lg">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Level</span>
                  <span className="text-xl font-bold">5</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
                <div className="text-xs opacity-75">60% to next level</div>
              </div>
            </GameCard>
          </div>
        </section>
      </div>
    </div>
  );
}

