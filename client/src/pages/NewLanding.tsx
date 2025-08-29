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
  ArrowFatLeftIcon as ArrowFatLeft,
  CaretDownIcon
} from "@phosphor-icons/react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "next-themes";
import { ArrowElbowDownLeftIcon, WebcamIcon } from "@phosphor-icons/react/dist/ssr";
import { useTranslation } from "react-i18next";

const languages = [
  { code: 'en', label: '🇺🇸 EN', name: 'English' },
  { code: 'ru', label: '🇷🇺 RU', name: 'Русский' },
  { code: 'es', label: '🇪🇸 ES', name: 'Español' },
  { code: 'zh', label: '🇨🇳 ZH', name: '中文' },
  { code: 'ar', label: '🇸🇦 AR', name: 'العربية' },
];

function NewLanding() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [videoDropdownOpen, setVideoDropdownOpen] = React.useState(false);
  const [headerDropdownOpen, setHeaderDropdownOpen] = React.useState(false);
  const [videoLanguage, setVideoLanguage] = React.useState('en');
  const { isMobile, isTablet } = useIsMobile();
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = React.useState(i18n.language || 'en');

  const handleLanguageChange = (languageCode: string) => {
    setCurrentLanguage(languageCode);
    i18n.changeLanguage(languageCode);
    localStorage.setItem('showpls-language', languageCode);
    setHeaderDropdownOpen(false);
  };

  const handleVideoLanguageChange = (languageCode: string) => {
    setVideoLanguage(languageCode);
    setVideoDropdownOpen(false);
  };

  return (
    <div className="flex overflow-hidden flex-col items-center pt-6 md:pt-10 min-h-screen px-4 md:px-8 lg:px-12 xl:px-20 bg-background text-foreground">

      {/* Header */}
      <header className="flex justify-between items-center w-full py-4">
        <div className="flex items-center gap-3 md:gap-4">
          <div className={"rounded-xl p-1 " + (theme === "light" && " bg-black")}>
            <img
              src="/logo4.png"
              alt="SHOWPLS"
              width={isMobile ? 31 : 42}
              height={isMobile ? 31 : 42}
              className="rounded-xl"
            />
          </div>
          <div className="text-2xl md:text-3xl font-bold">SHOW<span className="text-blue-400 dark:text-blue-300">PLS</span></div>
        </div>

        {isMobile || isTablet ? (
          <>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden transition-colors duration-300 text-foreground"
            >
              <ListIcon size={36} />
            </button>

            {isMobileMenuOpen && (
              <div className="fixed inset-0 z-50 p-8 flex flex-col bg-background">
                <div className="flex justify-end mb-8">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="transition-colors duration-300 text-foreground hover:transform hover:-translate-y-1 transition-transform duration-200"
                  >
                    <XIcon size={36} />
                  </Button>
                </div>

                <nav className="flex flex-col items-baseline gap-6 text-2xl font-medium">
                  <a>{t('header.home')}</a>
                  <a>{t("header.howItWorks")}</a>
                  <a>{t('header.roadmap')}</a>
                  <a>{t('header.joinTestnet')}</a>
                  <a>{t('header.community')}</a>

                  <div className="flex gap-6">
                    <button className="hover:transform hover:-translate-y-1 transition-all duration-200" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                      {theme === 'dark' ? <SunIcon size={26} /> : <MoonIcon size={26} />}
                    </button>

                    {/* Mobile Language Dropdown */}
                    <div className="relative">
                      <button
                        className="transition-colors duration-300 text-foreground flex items-center gap-1 hover:transform hover:-translate-y-1 transition-transform duration-200"
                        onClick={() => setHeaderDropdownOpen(!headerDropdownOpen)}
                      >
                        <TranslateIcon size={26} />
                        <CaretDownIcon size={16} />
                      </button>

                      {headerDropdownOpen && (
                        <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                          <div className="py-1">
                            {languages.map((language) => (
                              <button
                                key={language.code}
                                onClick={() => handleLanguageChange(language.code)}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                {language.label} {language.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button className="flex items-center gap-2.5 px-4 py-1 rounded-3xl transition-colors duration-300 bg-secondary text-secondary-foreground hover:transform hover:-translate-y-1 transition-transform duration-200">
                    <TelegramLogoIcon size={24} />
                    {t('header.start')}
                  </button>
                </nav>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-1 md:gap-2 lg:gap-3 text-base md:text-lg font-medium">
            <a className="px-2 md:px-3 py-1 rounded-xl hover:bg-neutral-200/50 dark:hover:bg-neutral-400/30 duration-150 hover:transform hover:-translate-y-1 transition-all">{t('header.home')}</a>
            <a className="px-2 md:px-3 py-1 rounded-xl hover:bg-neutral-200/50 dark:hover:bg-neutral-400/30 duration-150 hover:transform hover:-translate-y-1 transition-all">{t('header.howItWorks')}</a>
            <a className="px-2 md:px-3 py-1 rounded-xl hover:bg-neutral-200/50 dark:hover:bg-neutral-400/30 duration-150 hover:transform hover:-translate-y-1 transition-all">{t('header.roadmap')}</a>
            <a className="px-2 md:px-3 py-1 rounded-xl hover:bg-neutral-200/50 dark:hover:bg-neutral-400/30 duration-150 hover:transform hover:-translate-y-1 transition-all">{t('header.joinTestnet')}</a>
            <a className="px-2 md:px-3 py-1 rounded-xl hover:bg-neutral-200/50 dark:hover:bg-neutral-400/30 duration-150 hover:transform hover:-translate-y-1 transition-all">{t('header.community')}</a>

            <button className="transition-colors duration-300 hover:transform hover:-translate-y-1 transition-transform duration-200" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <SunIcon size={24} /> : <MoonIcon size={24} />}
            </button>

            {/* Desktop Language Dropdown */}
            <div className="relative">
              <button
                className="transition-colors duration-300 text-foreground flex items-center gap-1 hover:transform hover:-translate-y-1 transition-transform duration-200"
                onClick={() => setHeaderDropdownOpen(!headerDropdownOpen)}
              >
                <TranslateIcon size={24} />
                <CaretDownIcon size={16} />
              </button>

              {headerDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    {languages.map((language) => (
                      <button
                        key={language.code}
                        onClick={() => handleLanguageChange(language.code)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {language.label} {language.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <a href="https://t.me/showplsbot" target="_blank">
              <button className="flex gap-2.5 px-3 py-2 rounded-3xl hover:opacity-75 transition-opacity duration-300 bg-secondary text-secondary-foreground items-center hover:transform hover:-translate-y-1 transition-transform duration-200">
                <TelegramLogoIcon size={20} />
                {t('header.start')}
              </button>
            </a>

          </div>
        )}
      </header>

      {/* Hero Section - Tablet Optimization */}
      <section className="mt-8 md:mt-12 lg:mt-14 w-full">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 lg:gap-12">
          <div className="w-full md:w-[46%]">
            <h1 className="text-center lg:text-left text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight md:leading-snug">
              {t('hero.title')}
            </h1>
            <p className="text-center lg:text-left mt-3 md:mt-5 lg:mt-7 text-base md:text-lg lg:text-xl leading-relaxed text-muted-foreground">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-row gap-2 md:gap-3 lg:gap-4 mt-6 md:mt-8 lg:mt-12 font-medium items-center justify-center lg:justify-normal">
              <a href="https://t.me/showplsbot" target="_blank">
                <button className="flex items-center gap-2 px-2 md:px-3 py-2 rounded-3xl transition-all duration-150 bg-primary text-primary-foreground hover:opacity-75 hover:transform hover:-translate-y-1">
                  <EyeIcon size={20} />
                  {t('hero.seeButton')}
                </button>
              </a>
              <a href="https://t.me/showplsbot" target="_blank">
                <button className="flex items-center gap-2 px-[7px] md:px-[11px] py-[7px] rounded-3xl border-2 transition-all duration-150 border-primary text-card-foreground dark:text-primary hover:bg-primary hover:text-black hover:dark:text-black  hover:transform hover:-translate-y-1">
                  <WebcamIcon size={20} />
                  {t('hero.showButton')}
                </button>
              </a>
            </div>
          </div>
          <div className="w-full md:w-[54%] mt-6 md:mt-0 relative">
            <div className="w-full rounded-2xl shadow-lg overflow-hidden">
              <video
                key={videoLanguage} // This forces re-render when language changes
                className="w-full h-full rounded-2xl"
                controls
                autoPlay
                muted
                style={{ borderColor: 'var(--border)' }}
              >
                <source src={`/videos/showpls-demo-${videoLanguage}.mp4`} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Video Language Selector */}
            <div className="absolute top-2 right-2">
              <button
                onClick={() => setVideoDropdownOpen(!videoDropdownOpen)}
                className="bg-background/90 hover:bg-background text-foreground rounded-full p-2 transition-colors duration-200 flex items-center justify-center shadow-md hover:transform hover:-translate-y-1 transition-transform duration-200"
              >
                <TranslateIcon size={20} />
              </button>

              {videoDropdownOpen && (
                <div className="absolute right-0 mt-2 w-32 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => handleVideoLanguageChange('en')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      🇺🇸 English
                    </button>
                    <button
                      onClick={() => handleVideoLanguageChange('ru')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      🇷🇺 Русский
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-20 md:mt-40 w-full">
        {!isMobile && !isTablet ? (
          /* DESKTOP LAYOUT - Fixed height issue */
          <div className="relative flex items-stretch justify-between gap-8">
            {/* LEFT IMAGE - flexible, allowed to shrink/grow */}
            <div className="flex-shrink-0 basis-[22%] max-w-[340px] min-w-[160px]">
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg">
                <img src="/cameraMan.jpg" alt="Camera man" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* CENTER CONTENT - vertically centered */}
            <div className="flex-1 flex flex-col justify-center items-center relative py-8">
              {/* Top row (right aligned) */}
              <div className="w-full flex justify-end">
                <div className="flex items-center gap-6 lg:gap-10">
                  <div className="hidden lg:block">
                    <ArrowFatLeft weight="fill" size={64} className="text-black dark:text-white" />
                  </div>
                  <div className="text-right text-2xl md:text-3xl lg:text-4xl font-bold leading-tight max-w-[56ch]">
                    {t('earnSection.earnText')}
                  </div>
                </div>
              </div>

              {/* Squiggly - container reserves vertical space so it isn't purely floating */}
              <div className="w-full py-8 md:py-10">
                <div className="relative w-full" style={{ height: '5rem' }}>
                  <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full">
                    {theme === "light" ? (
                      <img
                        src="/squigglyLine.webp"
                        alt=""
                        className="mx-auto w-full max-w-[420px] md:max-w-[520px] rotate-[24deg] select-none"
                        aria-hidden
                      />
                    ) : (
                      <img
                        src="/squigglyLineDarkMode.png"
                        alt=""
                        className="mx-auto w-full max-w-[420px] md:max-w-[520px] rotate-[24deg] select-none"
                        aria-hidden
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom row (left aligned) */}
              <div className="w-full flex justify-start mt-4">
                <div className="flex items-center gap-6 lg:gap-10">
                  <div className="text-left text-2xl md:text-3xl lg:text-4xl font-bold leading-tight max-w-[56ch]">
                    {t('earnSection.anywhereText')}
                  </div>
                  <div className="hidden lg:block">
                    <ArrowFatLeft
                      weight="fill"
                      size={64}
                      className="text-black dark:text-white transform scale-x-[-1]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT STACKED IMAGES - flexible */}
            <div className="flex-shrink-0 basis-[22%] max-w-[340px] min-w-[160px]">
              <div className="w-full h-full rounded-2xl overflow-hidden shadow-lg">
                <div className="grid grid-rows-3 h-full">
                  <div className="w-full h-full overflow-hidden">
                    <img src="/newYork.jpg" alt="New York" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-full h-full overflow-hidden">
                    <img src="/london.jpg" alt="London" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-full h-full overflow-hidden">
                    <img src="/china.jpg" alt="China" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* MOBILE / TABLET LAYOUT (camera left, text+arrow right [column centered], squiggly below, reversed bottom row with stacked images on right) */
          <div className="relative w-full max-w-5xl mx-auto">
            <div className="flex items-center gap-4 w-full">
              {/* LEFT: cameraMan */}
              <div className="flex-shrink-0 w-1/2 max-w-[260px] min-w-[120px] h-72 md:h-96">
                <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg">
                  <img src="/cameraMan.jpg" alt="Camera man" className="w-full h-full object-cover" />
                </div>
              </div>

              {/* RIGHT: text above arrow, centered column */}
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <div className={`font-bold text-center leading-tight ${isTablet ? 'text-xl' : 'text-3xl'}`}>
                  {t('earnSection.earnText')}
                </div>
                <div>
                  <ArrowElbowDownLeftIcon
                    weight="fill"
                    size={isTablet ? 74 : 96}
                    className="text-black dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Squiggly reserved space below the top row */}
            <div className="relative w-full mt-4 md:mt-6">
              <div className="h-24 md:h-32 w-full relative">
                <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full">
                  {theme === "light" ? (
                    <img
                      src="/squigglyLine.webp"
                      alt=""
                      className="mx-auto w-full max-w-[420px] md:max-w-[540px] rotate-[24deg] select-none"
                      aria-hidden
                    />
                  ) : (
                    <img
                      src="/squigglyLineDarkMode.png"
                      alt=""
                      className="mx-auto w-full max-w-[420px] md:max-w-[540px] rotate-[24deg] select-none"
                      aria-hidden
                    />
                  )}
                </div>
              </div>
            </div>

            {/* BOTTOM ROW: reversed - text+arrow left (centered column), stacked images right with same height as cameraMan */}
            <div className="mt-4 md:mt-6 flex items-center gap-4 w-full">
              {/* left: text over arrow, centered */}
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <div className={`font-bold text-center leading-tight ${isTablet ? 'text-2xl' : 'text-4xl'}`}>
                  {t('earnSection.anywhereText')}
                </div>
                <div>
                  <ArrowElbowDownLeftIcon
                    weight="fill"
                    size={isTablet ? 74 : 96}
                    className="text-black dark:text-white transform scale-x-[-1]"
                  />
                </div>
              </div>

              {/* right: stacked images - same height as cameraMan */}
              <div className="flex-shrink-0 w-1/2 max-w-[260px] min-w-[120px] h-72 md:h-96">
                <div className="w-full h-full rounded-2xl overflow-hidden shadow-lg">
                  <div className="grid grid-rows-3 h-full">
                    <div className="overflow-hidden h-full">
                      <img src="/newYork.jpg" alt="New York" className="w-full h-full object-cover" />
                    </div>
                    <div className="overflow-hidden h-full">
                      <img src="/london.jpg" alt="London" className="w-full h-full object-cover" />
                    </div>
                    <div className="overflow-hidden h-full">
                      <img src="/china.jpg" alt="China" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Why use ShowPls? Section */}
      <section className="mt-20 md:mt-40 w-full">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-center lg:text-left text-3xl md:text-4xl lg:text-5xl font-bold">{t('features.title')}</h2>
            <p className="text-center lg:text-left mt-2 text-base md:text-lg text-muted-foreground">
              {t('features.subtitle')}
            </p>
          </div>
          <a href="https://t.me/showplsbot" target="_blank">
            <button className="font-medium flex gap-2.5 px-3 py-2 rounded-3xl hover:opacity-75 duration-200 bg-secondary text-secondary-foreground items-center hover:transform hover:-translate-y-1 transition-all">
              <TelegramLogoIcon size={24} />
              {t('header.start')}
            </button>
          </a>
        </div>

        {/* Features Cards Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card-foreground dark:bg-primary border-none">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center">
                  <LightningIcon size={48} className="text-white dark:text-black" />
                </div>
                <CardTitle className="mt-6 text-2xl md:text-3xl text-white dark:text-black">
                  {t('features.realTimePayments')}
                </CardTitle>
                <p className="mt-4 text-white dark:text-black font-medium">
                  {t('features.realTimeDescription')}
                </p>
              </div>
              <a href="https://t.me/showplsbot" target="_blank">
                <button className="mt-8 bg-primary dark:bg-card-foreground px-4 py-1 font-medium rounded-3xl transition-opacity duration-150 w-fit text-black dark:text-white hover:opacity-75 hover:transform hover:-translate-y-1 transition-transform duration-200">
                  {t('features.startNow')}
                </button>
              </a>
            </CardContent>
          </Card>

          <Card className="bg-card-foreground dark:bg-primary border-none">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center">
                  <GlobeIcon size={48} className="text-white dark:text-black" />
                </div>
                <CardTitle className="mt-6 text-2xl md:text-3xl text-white dark:text-black">
                  {t('features.globalNetwork')}
                </CardTitle>
                <p className="mt-4 text-white dark:text-black font-medium">
                  {t('features.globalDescription')}
                </p>
              </div>
              <a href="https://t.me/showplsbot" target="_blank">
                <button className="mt-8 bg-primary dark:bg-card-foreground px-4 py-1 font-medium rounded-3xl transition-opacity duration-150 w-fit text-black dark:text-white hover:opacity-75 hover:transform hover:-translate-y-1 transition-transform duration-200">
                  {t('features.startNow')}
                </button>
              </a>
            </CardContent>
          </Card>

          <Card className="bg-card-foreground dark:bg-primary border-none">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center">
                  <WalletIcon size={48} className="text-white dark:text-black" />
                </div>
                <CardTitle className="mt-6 text-2xl md:text-3xl text-white dark:text-black">
                  {t('features.telegramWallet')}
                </CardTitle>
                <p className="mt-4 text-white dark:text-black font-medium">
                  {t('features.walletDescription')}
                </p>
              </div>
              <a href="https://t.me/showplsbot" target="_blank">
                <button className="mt-8 bg-primary dark:bg-card-foreground px-4 py-1 font-medium rounded-3xl transition-opacity duration-150 w-fit text-black dark:text-white hover:opacity-75 hover:transform hover:-translate-y-1 transition-transform duration-200">
                  {t('features.startNow')}
                </button>
              </a>
            </CardContent>
          </Card>

          <Card className="bg-card-foreground dark:bg-primary border-none">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center">
                  <VerifiedIcon size={48} className="text-white dark:text-black" />
                </div>
                <CardTitle className="mt-6 text-2xl md:text-3xl text-white dark:text-black">
                  {t('features.verifiedCommunity')}
                </CardTitle>
                <p className="mt-4 text-white dark:text-black font-medium">
                  {t('features.verifiedDescription')}
                </p>
              </div>
              <a href="https://t.me/showplsbot" target="_blank">
                <button className="mt-8 bg-primary dark:bg-card-foreground px-4 py-1 font-medium rounded-3xl transition-opacity duration-150 w-fit text-black dark:text-white hover:opacity-75 hover:transform hover:-translate-y-1 transition-transform duration-200">
                  {t('features.startNow')}
                </button>
              </a>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="mt-20 md:mt-40 w-full">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">{t('testimonials.title')}</h2>

        <div className="mt-12 flex flex-col lg:flex-row gap-8 md:gap-12 items-center">
          <div className="w-full lg:w-[66%]">
            <h3 className="text-2xl md:text-3xl font-bold">{t('testimonials.subtitle')}</h3>
            <div className="flex gap-1 mt-4">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} weight="fill" size={21} className="text-yellow-400" />
              ))}
            </div>
            <p className="mt-8 text-lg md:text-xl text-muted-foreground">
              {t('testimonials.testimonialText')}
            </p>
          </div>

          <div className="w-full lg:w-[34%] space-y-6">
            <Card className="bg-secondary border-none p-6">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xl font-medium text-secondary-foreground">Dimon Oshparennyy</div>
                  <div className="text-black">CEO of Filming Studio</div>
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
                  <div className="text-black">Youtube Content Creator</div>
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
                  <div className="text-black">Professional Photographer</div>
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
      <section className="mt-20 md:mt-40 flex flex-col items-center text-center gap-6">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">{t('cta.title')}</h2>
        <p className="text-lg md:text-xl text-muted-foreground">
          {t('cta.subtitle')}
        </p>
        <a href="https://t.me/showplsbot" target="_blank">
          <button className="font-medium flex gap-2.5 px-3 py-2 rounded-3xl hover:opacity-75 transition-opacity duration-300 bg-primary text-secondary-foreground items-center hover:transform hover:-translate-y-1 transition-transform duration-200">
            <TelegramLogoIcon size={24} />
            {t('header.start')}
          </button>
        </a>
      </section>

      {/* Footer */}
      <footer className="mt-20 md:mt-32 w-full py-12 border-t border-border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className={"rounded-xl p-1 " + (theme === "light" && " bg-black")}>
                <img
                  src="/logo4.png"
                  alt="SHOWPLS"
                  width={isMobile ? 31 : 42}
                  height={isMobile ? 31 : 42}
                  className="rounded-xl"
                />
              </div>
              <div className="text-2xl md:text-3xl font-bold">SHOW<span className="text-blue-400 dark:text-blue-300">PLS</span></div>
            </div>
            <p className="max-w-xs text-muted-foreground">
              {t('footer.description')}
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="icon" className="w-10 h-10 transition-colors duration-300 bg-muted text-background hover:transform hover:-translate-y-1 transition-transform duration-200">
                <TranslateIcon size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="w-10 h-10 transition-colors duration-300 bg-muted text-background hover:transform hover:-translate-y-1 transition-transform duration-200">
                <UsersIcon size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="w-10 h-10 transition-colors duration-300 bg-muted text-background hover:transform hover:-translate-y-1 transition-transform duration-200">
                <ShieldIcon size={20} />
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 md:gap-16 text-muted-foreground">
            <div>{t('footer.copyright')}</div>
            <div className="flex gap-4 md:gap-6">
              <span>{t('footer.privacy')}</span>
              <span>{t('footer.terms')}</span>
              <span>{t('footer.cookies')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default NewLanding;