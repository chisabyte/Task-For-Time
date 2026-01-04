"use client";

import { useState } from "react";
import Link from "next/link";
import { StatsSection } from "./components/StatsSection";
import { PsychologySection } from "./components/PsychologySection";
import { HowItWorksSection } from "./components/HowItWorksSection";
import { TestimonialsSection } from "./components/TestimonialsSection";
import { PricingSection } from "./components/PricingSection";
import { FitSection } from "./components/FitSection";
import { ComparisonSection } from "./components/ComparisonSection";
import { TrustSection } from "./components/TrustSection";
import { FAQSection } from "./components/FAQSection";
import { CTASection } from "./components/CTASection";
import { FooterSection } from "./components/FooterSection";

export default function LandingPage() {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      <header className="w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="text-primary">
                <span className="material-symbols-outlined text-3xl">diversity_3</span>
              </div>
              <h2 className="text-lg font-bold tracking-tight text-text-main dark:text-white">Task For Time</h2>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <nav className="flex gap-6">
                <a className="text-sm font-medium hover:text-primary transition-colors" href="#why-it-works">Psychology</a>
                <a className="text-sm font-medium hover:text-primary transition-colors" href="#how-it-works">How It Works</a>
                <a className="text-sm font-medium hover:text-primary transition-colors" href="#pricing">Pricing</a>
                <a className="text-sm font-medium hover:text-primary transition-colors" href="#comparison">Comparison</a>
              </nav>
              <div className="flex gap-3">
                <Link href="/login" className="flex h-14 items-center justify-center rounded-xl px-8 text-lg font-bold text-text-main dark:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                  Login
                </Link>
                <Link href="/login" className="flex h-14 items-center justify-center rounded-xl bg-primary px-8 text-lg font-bold text-text-main shadow-lg hover:brightness-105 transition-all">
                  Get Started
                </Link>
              </div>
            </div>
            <div className="md:hidden text-text-main dark:text-white flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 -mr-2 hover:text-primary transition-colors focus:outline-none"
              >
                <span className="material-symbols-outlined">{isMenuOpen ? 'close' : 'menu'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 top-16 z-40 bg-white dark:bg-background-dark animate-in fade-in slide-in-from-top-4 duration-200">
            <nav className="flex flex-col p-6 gap-6">
              <a
                onClick={() => setIsMenuOpen(false)}
                className="text-lg font-bold hover:text-primary transition-colors border-b border-gray-100 dark:border-gray-800 pb-2"
                href="#why-it-works"
              >
                Psychology
              </a>
              <a
                onClick={() => setIsMenuOpen(false)}
                className="text-lg font-bold hover:text-primary transition-colors border-b border-gray-200 dark:border-gray-800 pb-2"
                href="#how-it-works"
              >
                How It Works
              </a>
              <a
                onClick={() => setIsMenuOpen(false)}
                className="text-lg font-bold hover:text-primary transition-colors border-b border-gray-200 dark:border-gray-800 pb-2"
                href="#pricing"
              >
                Pricing
              </a>
              <a
                onClick={() => setIsMenuOpen(false)}
                className="text-lg font-bold hover:text-primary transition-colors border-b border-gray-200 dark:border-gray-800 pb-2"
                href="#comparison"
              >
                Comparison
              </a>
              <div className="flex flex-col gap-4 pt-4">
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex h-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-base font-bold text-text-main dark:text-white"
                >
                  Login
                </Link>
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex h-12 items-center justify-center rounded-xl bg-primary text-base font-bold text-text-main shadow-md"
                >
                  Get Started
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>
      <main className="flex-grow flex flex-col items-center">
        <section className="w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16 md:py-24 overflow-visible">
          <div className="@container">
            <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
              <div className="flex flex-col gap-6 flex-1 max-w-2xl z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs font-bold uppercase tracking-widest w-fit">
                  Join 2,500+ families building trust
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-text-main dark:text-white">
                  End the screen time battle. <span className="text-primary">Start building habits.</span>
                </h1>
                <p className="text-lg text-text-sub dark:text-gray-300 leading-relaxed max-w-xl">
                  Replace constant conflict with a simple system. Kids earn minutes by completing tasks, and you approve with a tap. No spying, no lockdowns—just clear agreements.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Link href="/login" className="flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-bold text-text-main shadow-md hover:translate-y-[-1px] transition-transform">
                    Start 30-Day Free Trial
                  </Link>
                  <button onClick={() => setIsVideoModalOpen(true)} className="flex h-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 px-6 text-base font-bold text-text-main dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors gap-2">
                    <span className="material-symbols-outlined">play_circle</span>
                    Watch Demo
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 pt-6 text-xs text-text-sub dark:text-gray-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-primary">lock</span>
                    <span>Bank-Level Encryption</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-primary">verified_user</span>
                    <span>COPPA Compliant</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-primary">block</span>
                    <span>No Data Selling</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-primary">calendar_month</span>
                    <span>30-Day Guarantee</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-primary">credit_card_off</span>
                    <span>No Credit Card Req.</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 w-full lg:max-w-[600px] relative mt-12 lg:mt-0">
                <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl opacity-50"></div>
                <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 group transform transition-transform hover:scale-[1.01] duration-500 z-10">
                  <img alt="Side-by-side image showing a frustrated parent and defensive child on the left (representing control-based screen time), and a calm parent and relaxed child cooperating on the right (representing trust-based screen time). Caption: Control creates conflict. Trust creates cooperation." className="w-full h-auto object-cover" loading="eager" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvHtC4j4Rzfs4gXnQRQ9AiqEpaOl9vYsZqIWsB5J1I4A5WJvGE7DWTRtSa73BKLwX4cIE1CsVgIyiqAsl17B0h1ZrX33xXmrkwHPIC1PmTZG5Gq7wLySmZbE9rb0K1Pgyfh92C9N1JN-dnx3ZdyeGpiZD4GdMY11Pi8ySpnglNWoxtPhLS4yxUHXQgNauoP37SIwnAv97o2OyXykyZFPs4t04fdnGJt_k0XojzmoLiPcajjdhVCsGzDfQa9_3kIzIN9fmqRL-0ovo" />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 pt-20">
                    <p className="text-white font-bold text-center text-lg sm:text-xl leading-tight drop-shadow-md">
                      &quot;Control creates conflict. Trust creates cooperation.&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {isVideoModalOpen && (
            <dialog className="backdrop:bg-black/80 rounded-2xl p-0 overflow-hidden w-full max-w-4xl shadow-2xl fixed inset-0 m-auto" open>
              <div className="relative bg-black aspect-video w-full flex items-center justify-center group">
                <button className="absolute top-4 right-4 z-50 text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors" onClick={() => setIsVideoModalOpen(false)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
                <div className="text-center text-white">
                  <span className="material-symbols-outlined text-6xl mb-4 group-hover:scale-110 transition-transform cursor-pointer">play_circle</span>
                  <p className="font-bold text-xl">Demo Video Placeholder</p>
                  <p className="text-sm text-gray-400">Video player integration goes here</p>
                </div>
              </div>
            </dialog>
          )}
        </section>

        <StatsSection />
        <PsychologySection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection />
        <FitSection />
        <ComparisonSection />
        <TrustSection />
        <FAQSection />
        <CTASection onOpenVideoModal={() => setIsVideoModalOpen(true)} />
      </main>
      <FooterSection />
    </div>
  );
}
