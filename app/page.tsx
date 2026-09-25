"use client";

import React, { useState } from "react";
import {
  LandingHeader,
  HeroSection,
  TerminalPreview,
  FeatureMatrix,
  LandingCta,
  LandingFooter,
  ALL_FEATURES,
  FEATURE_CATEGORIES,
  type TerminalView,
} from "@/features/landing";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TerminalView>("signal");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const filteredFeatures =
    selectedCategory === "All"
      ? ALL_FEATURES
      : ALL_FEATURES.filter((f) => f.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#060608] text-zinc-100 selection:bg-btc-gold/20 selection:text-btc-gold relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-btc-gold/10 via-amber-500/5 to-transparent blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[800px] -left-60 w-[600px] h-[600px] bg-blue-600/5 blur-[150px] pointer-events-none -z-10" />
      <div className="absolute top-[1400px] -right-60 w-[600px] h-[600px] bg-signal-long/5 blur-[150px] pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.25] pointer-events-none -z-10" />

      {/* Modular Landing Sections */}
      <LandingHeader />
      <HeroSection />
      <TerminalPreview activeTab={activeTab} setActiveTab={setActiveTab} />
      <FeatureMatrix
        categories={FEATURE_CATEGORIES}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        features={filteredFeatures}
      />
      <LandingCta />
      <LandingFooter />
    </div>
  );
}
