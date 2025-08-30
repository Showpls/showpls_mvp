import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "next-themes";
import Header from "@/landing/Header";
import HeroSection from "@/landing/HeroSection";
import TwoColumnSection from "@/landing/TwoColumnSection";
import HowItWorksSection from "@/landing/HowItWorksSection";
import TestimonialsSection from "@/landing/TestimonialsSection";
import CallToActionSection from "@/landing/CallToAction";
import Footer from "@/landing/Footer";
import { useState } from "react";

function NewLanding() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isMobile, isTablet } = useIsMobile();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex overflow-hidden flex-col items-center pt-6 md:pt-10 min-h-screen px-4 md:px-8 lg:px-12 xl:px-20 bg-background text-foreground">
      <Header
        {...{
          theme,
          setTheme,
          isMobile,
          isTablet,
          setIsMobileMenuOpen,
          isMobileMenuOpen,
        }}
      />

      <HeroSection />

      <TwoColumnSection
        isMobile={isMobile}
        isTablet={isTablet}
        theme={theme}
      />

      <HowItWorksSection />

      <TestimonialsSection />

      <CallToActionSection />

      <Footer />

    </div>
  );
}

export default NewLanding;