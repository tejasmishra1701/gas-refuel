"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState } from "react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="text-3xl">⛽</div>
            <div>
              <h1 className="text-xl font-display font-bold text-white">
                FuelFlow
              </h1>
              <p className="text-xs text-zinc-400 font-body">
                Cross-Chain Gas Station
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#dashboard"
              className="text-zinc-300 hover:text-white transition-colors font-body"
            >
              Dashboard
            </a>
            <a
              href="#chains"
              className="text-zinc-300 hover:text-white transition-colors font-body"
            >
              Supported Chains
            </a>
            <a
              href="#history"
              className="text-zinc-300 hover:text-white transition-colors font-body"
            >
              Transaction History
            </a>
            <a
              href="#widgets"
              className="text-zinc-300 hover:text-white transition-colors font-body"
            >
              Nexus Widgets
            </a>
          </nav>

          {/* Connect Button */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <ConnectButton />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-zinc-800/50 py-4">
            <nav className="flex flex-col gap-4">
              <a
                href="#dashboard"
                className="text-zinc-300 hover:text-white transition-colors font-body py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </a>
              <a
                href="#chains"
                className="text-zinc-300 hover:text-white transition-colors font-body py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Supported Chains
              </a>
              <a
                href="#history"
                className="text-zinc-300 hover:text-white transition-colors font-body py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Transaction History
              </a>
              <a
                href="#widgets"
                className="text-zinc-300 hover:text-white transition-colors font-body py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Nexus Widgets
              </a>
              <div className="pt-4 border-t border-zinc-800/50">
                <ConnectButton />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
