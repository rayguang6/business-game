'use client';

import Link from 'next/link';

export default function WelcomePage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Business Game</h1>
          <p className="text-lg text-gray-600">Welcome to your business adventure</p>
        </div>
        
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <div className="mb-6">
            <div className="text-6xl mb-4">🏢</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">Ready to Start?</h2>
            <p className="text-gray-600">Click the button below to begin your journey</p>
          </div>
          
          <Link 
            href="/select-industry"
            className="block w-full px-8 py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 text-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Start Game
          </Link>
        </div>
      </div>
    </div>
  );
}