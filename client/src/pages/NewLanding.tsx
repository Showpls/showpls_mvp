import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import FeaturesCTA from "@/components/landing/features/FeaturesCTA";
import Footer from "@/components/landing/Footer";

export default function ModernLanding() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex flex-1 flex-col">
        <div className="flex flex-col !pt-0">
          <HeroSection />
          <FeaturesSection />
          <FeaturesCTA />
        </div>
      </main>
      <Footer />
    </div>
  );
}