// import Header from "@/landing/Header";
// import HeroSection from "@/landing/HeroSection";
// import ShowcaseSection from "@/landing/ShowcaseSection";
// import WhyShowplsSection from "@/landing/FourCardSection";
// import TestimonialsSection from "@/landing/TestimonialSection";
// import CtaFooterSection from "@/landing/CtaFooterSection";

// export default function ModernLanding() {
//   return (
//     <div className="max-w-[1440px] px-8 md:px-12 lg:px-20">
//       <Header />
//       <HeroSection />
//       <ShowcaseSection />
//       <WhyShowplsSection />
//       <TestimonialsSection />
//       <CtaFooterSection />
//     </div>
//   )
// }

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ListIcon,
  SunIcon,
  TranslateIcon,
  TelegramLogoIcon,
  MoonIcon,
  XIcon,
  UsersIcon,
  ShieldIcon,
  StarIcon,
  EyeIcon,
  LightningIcon,
  GlobeIcon,
  WalletIcon,
  SealCheckIcon as VerifiedIcon,
  ArrowFatLeftIcon as ArrowFatLeft
} from "@phosphor-icons/react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "next-themes";

function NewLanding() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex overflow-hidden flex-col items-center pt-6 md:pt-14 min-h-screen px-8 md:px-12 lg:px-20 bg-background text-foreground">

      {/* Header */}
      <header className="flex justify-between items-center w-full py-4">
        <div className="flex items-center gap-4">
          <div className="bg-secondary rounded-xl p-1">
            <img
              src="/logo4.png"
              alt="SHOWPLS"
              width={isMobile ? 31 : 42}
              height={isMobile ? 31 : 42}
              className="rounded-xl"
            />
          </div>
          <div className="text-2xl md:text-3xl font-bold">SHOWPLS</div>
        </div>

        {isMobile ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden transition-colors duration-300 text-foreground"
            >
              <ListIcon size={36} />
            </Button>

            {isMobileMenuOpen && (
              <div className="fixed inset-0 z-50 p-8 flex flex-col bg-background">
                <div className="flex justify-end mb-8">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="transition-colors duration-300 text-foreground"
                  >
                    <XIcon size={36} />
                  </Button>
                </div>

                <nav className="flex flex-col gap-6 text-2xl font-medium">
                  <div>Home</div>
                  <div>Features</div>
                  <div>About</div>

                  <div className="flex gap-6 mt-8">
                    <Button variant="ghost" size="icon" className="transition-colors duration-300 text-foreground">
                      <TranslateIcon size={36} />
                    </Button>
                    <Button variant="ghost" size="icon" className="transition-colors duration-300" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                      {theme === 'dark' ? <SunIcon size={36} /> : <MoonIcon size={36} />}
                    </Button>
                  </div>

                  <Button className="flex gap-2.5 px-3 py-3 rounded-3xl transition-colors duration-300 bg-secondary text-secondary-foreground">
                    <TelegramLogoIcon size={24} />
                    Start
                  </Button>
                </nav>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-6 text-lg font-medium">
            <div>Home</div>
            <div>Features</div>
            <div>About</div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="transition-colors duration-300 text-foreground">
                <TranslateIcon size={36} />
              </Button>
              <Button variant="ghost" size="icon" className="transition-colors duration-300" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? <SunIcon size={36} /> : <MoonIcon size={36} />}
              </Button>

              <Button className="flex gap-2.5 px-3 py-3 rounded-3xl transition-colors duration-300 bg-secondary text-secondary-foreground">
                <TelegramLogoIcon size={24} />
                Start
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="mt-10 md:mt-14 w-full">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          <div className="w-full md:w-[46%]">
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight md:leading-[100px]">
              Your Eyes <br />
              Everywhere
            </h1>
            <p className="mt-4 md:mt-7 text-lg md:text-xl leading-relaxed text-muted-foreground">
              Get real-time visual verification from people around the
              world. Request photos, videos, or live streams of any place,
              product, or event.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8 md:mt-12">
              <Button className="flex gap-2 px-4 py-3 rounded-3xl transition-colors duration-300 bg-primary text-primary-foreground">
                <EyeIcon size={24} />
                I want to see
              </Button>
              <Button variant="outline" className="flex gap-2 px-4 py-3 rounded-3xl border-2 transition-colors duration-300 border-primary text-card-foreground">
                <EyeIcon size={24} />
                I can show
              </Button>
            </div>
          </div>
          <div className="w-full md:w-[54%] mt-6 md:mt-0">
            <div className="w-full rounded-2xl aspect-video shadow-lg overflow-hidden">
              <video
                className="w-full h-full rounded-2xl"
                controls
                autoPlay
                muted
                style={{ borderColor: 'var(--border)' }}
              >
                <source src="/showpls-demo-en.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-20 md:mt-40 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-12">
          {/* LEFT IMAGE */}
          <div className="w-full lg:w-[27%]">
            <div className="relative w-full rounded-2xl overflow-hidden shadow-lg aspect-[0.7]">
              <img
                src="/cameraMan.jpg"
                alt="Camera man"
                className="w-full h-full object-cover max-h-[400px] md:max-h-none"
              />
              <div className="absolute inset-0 pointer-events-none" aria-hidden />
            </div>
          </div>

          {/* CENTER CONTENT */}
          <div className="w-full lg:w-[46%] relative flex flex-col items-center gap-12 md:gap-20">
            {/* top row */}
            <div className="flex items-center gap-6 md:gap-8 z-10">
              <div className="flex items-center justify-center">
                <ArrowFatLeft weight="fill" size={36} />
              </div>

              <div className="text-center md:text-left">
                <div className="text-2xl md:text-3xl font-bold">
                  Earn real money
                  <br className="md:hidden" /> <span>with TON blockchain</span>
                </div>
              </div>
            </div>

            {/* squiggly line */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
              <img
                src="/squigglyLine.webp"
                alt=""
                className="pointer-events-none w-[260px] max-w-[60%] mx-auto rotate-[24deg]"
                aria-hidden
              />
            </div>

            {/* bottom (mirrored) row */}
            <div className="flex items-center gap-6 md:gap-8 z-10">
              <div className="text-center md:text-right">
                <div className="text-2xl md:text-3xl font-bold">
                  From anywhere
                  <br className="md:hidden" /> <span>in the world</span>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="transform scale-x-[-1]">
                  <ArrowFatLeft weight="fill" size={36} />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT STACKED IMAGES */}
          <div className="w-full lg:w-[27%]">
            <div className="w-full rounded-2xl overflow-hidden shadow-lg grid grid-rows-3 h-[min(60vh,720px)]">
              <div className="w-full h-full">
                <img
                  src="/china.jpg"
                  alt="China"
                  className="w-full h-full object-cover max-h-[133px] md:max-h-none"
                />
              </div>
              <div className="w-full h-full">
                <img
                  src="/newYork.jpg"
                  alt="New York"
                  className="w-full h-full object-cover max-h-[133px] md:max-h-none"
                />
              </div>
              <div className="w-full h-full">
                <img
                  src="/london.jpg"
                  alt="London"
                  className="w-full h-full object-cover max-h-[133px] md:max-h-none"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why use ShowPls? Section */}
      <section className="mt-20 md:mt-40 w-full">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">Why use ShowPls?</h2>
            <p className="mt-2 text-base md:text-lg text-muted-foreground">
              Get instant visual verification from people worldwide
            </p>
          </div>
          <Button className="flex gap-2 px-6 py-3 rounded-3xl transition-colors duration-300 bg-secondary text-secondary-foreground">
            <TelegramLogoIcon size={24} />
            Start
          </Button>
        </div>

        {/* Features Cards Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card-foreground border-none">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-primary">
                  <LightningIcon size={32} className="text-primary-foreground" />
                </div>
                <CardTitle className="mt-6 text-2xl md:text-3xl text-white">
                  Real-Time Payments
                </CardTitle>
                <p className="mt-4 text-white/90 font-medium">
                  Get instant visual verification from people worldwide
                </p>
              </div>
              <Button className="mt-8 rounded-3xl transition-colors duration-300 w-fit bg-primary text-primary-foreground">
                Start now
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-none">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-primary">
                  <GlobeIcon size={32} className="text-primary-foreground" />
                </div>
                <CardTitle className="mt-6 text-2xl md:text-3xl">
                  Global Network
                </CardTitle>
                <p className="mt-4 text-muted-foreground font-medium">
                  Connect with local reporters in any city, any place, any time
                </p>
              </div>
              <Button className="mt-8 rounded-3xl transition-colors duration-300 w-fit bg-card-foreground text-white">
                Start now
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-none">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-primary">
                  <WalletIcon size={32} className="text-primary-foreground" />
                </div>
                <CardTitle className="mt-6 text-2xl md:text-3xl">
                  Telegram TON Wallet
                </CardTitle>
                <p className="mt-4 text-muted-foreground font-medium">
                  Payments are made via Telegram built-in wallet, with Ton modern cryptocurrency
                </p>
              </div>
              <Button className="mt-8 rounded-3xl transition-colors duration-300 w-fit bg-card-foreground text-white">
                Start now
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-none">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-primary">
                  <VerifiedIcon size={32} className="text-primary-foreground" />
                </div>
                <CardTitle className="mt-6 text-2xl md:text-3xl">
                  Verified Community
                </CardTitle>
                <p className="mt-4 text-muted-foreground font-medium">
                  Trusted community with ratings and reviews, build reputation for better results
                </p>
              </div>
              <Button className="mt-8 rounded-3xl transition-colors duration-300 w-fit bg-card-foreground text-white">
                Start now
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="mt-20 md:mt-40 w-full">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">Testimonials</h2>

        <div className="mt-12 flex flex-col lg:flex-row gap-8 md:gap-12 items-center">
          <div className="w-full lg:w-[66%]">
            <h3 className="text-2xl md:text-3xl font-bold">Greatest experience in my life!</h3>
            <div className="flex gap-1 mt-4">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} weight="fill" size={21} className="text-yellow-400" />
              ))}
            </div>
            <p className="mt-8 text-lg md:text-xl text-muted-foreground">
              There are many variations of passages of Lorem Ipsum available,
              but the majority have suffered alteration in some form, by
              injected humour, or randomised words which don't look even
              slightly believable.
            </p>
          </div>

          <div className="w-full lg:w-[34%] space-y-6">
            <Card className="bg-secondary border-none p-6">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xl font-medium text-secondary-foreground">Dimon Oshparennyy</div>
                  <div className="text-muted-foreground">CEO of Filming Studio</div>
                </div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-muted text-background">
                  <UsersIcon size={24} />
                </div>
              </div>
            </Card>

            <Card className="bg-secondary border-none p-6">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xl font-medium text-secondary-foreground">Danila Bogrov</div>
                  <div className="text-muted-foreground">Youtube Content Creator</div>
                </div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-muted text-background">
                  <UsersIcon size={24} />
                </div>
              </div>
            </Card>

            <Card className="bg-secondary border-none p-6">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xl font-medium text-secondary-foreground">Sasha Belii</div>
                  <div className="text-muted-foreground">Professional Photographer</div>
                </div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-muted text-background">
                  <UsersIcon size={24} />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="mt-20 md:mt-40 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">Ready to start?</h2>
        <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto text-muted-foreground">
          Just open the Showpls Bot in telegram app and everything is ready to go
        </p>
        <Button className="mt-6 flex gap-2 mx-auto px-6 py-3 rounded-3xl transition-colors duration-300 bg-primary text-primary-foreground">
          <TelegramLogoIcon size={24} />
          Start
        </Button>
      </section>

      {/* Footer */}
      <footer className="mt-20 md:mt-32 w-full py-12 border-t border-border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-secondary">
                <img
                  src="/logo4.png"
                  alt="SHOWPLS"
                  width={32}
                  height={32}
                  className="rounded-xl"
                />
              </div>
              <div className="text-2xl font-bold">Showpls</div>
            </div>
            <p className="max-w-xs text-muted-foreground">
              Real-time global content marketplace powered by TON blockchain escrow.
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="icon" className="w-10 h-10 transition-colors duration-300 bg-muted text-background">
                <TranslateIcon size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="w-10 h-10 transition-colors duration-300 bg-muted text-background">
                <UsersIcon size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="w-10 h-10 transition-colors duration-300 bg-muted text-background">
                <ShieldIcon size={20} />
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 md:gap-16 text-muted-foreground">
            <div>© 2025 Showpls. All rights reserved.</div>
            <div className="flex gap-4 md:gap-6">
              <span>Privacy</span>
              <span>Terms</span>
              <span>Cookies</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default NewLanding;