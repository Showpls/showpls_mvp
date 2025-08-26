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
    LightningIcon,
    GlobeIcon,
    WalletIcon,
    SealCheckIcon as VerifiedIcon,
    CameraIcon,
    EyeIcon,
    MoneyIcon,
    ShieldIcon,
    UsersIcon,
    ClockIcon,
    DeviceTabletSpeakerIcon,
    CreditCardIcon,
    BankIcon,
    CaretDownIcon,
    CheckCircleIcon,
    StarIcon
} from "@phosphor-icons/react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";

const languages = [
    { code: 'en', label: '🇺🇸 EN', name: 'English' },
    { code: 'ru', label: '🇷🇺 RU', name: 'Русский' },
    { code: 'es', label: '🇪🇸 ES', name: 'Español' },
    { code: 'zh', label: '🇨🇳 ZH', name: '中文' },
    { code: 'ar', label: '🇸🇦 AR', name: 'العربية' },
];

function FeaturesLanding() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [headerDropdownOpen, setHeaderDropdownOpen] = React.useState(false);
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

    return (
        <div className="flex overflow-hidden flex-col items-center pt-6 md:pt-10 min-h-screen px-4 md:px-8 lg:px-12 xl:px-20 bg-background text-foreground">

            {/* Header */}
            <header className="flex justify-between items-center w-full py-4">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="bg-emerald-600 rounded-xl p-1">
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
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden transition-colors duration-300 text-foreground"
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
                                    <a>Home</a>
                                    <a className="text-primary">Features</a>
                                    <a>About</a>

                                    <div className="flex gap-6">
                                        <button className="transition-colors duration-300 hover:transform hover:-translate-y-1 transition-transform duration-200" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                                            {theme === 'dark' ? <SunIcon size={26} /> : <MoonIcon size={26} />}
                                        </button>

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
                                        Start Now
                                    </button>
                                </nav>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex items-center gap-3 md:gap-4 lg:gap-6 text-base md:text-lg font-medium">
                        <a className="px-2 md:px-3 py-1 rounded-xl hover:bg-neutral-200/50 dark:hover:bg-neutral-400/30 duration-150 hover:transform hover:-translate-y-1 transition-transform duration-200">Home</a>
                        <a className="px-2 md:px-3 py-1 rounded-xl bg-neutral-200/50 dark:bg-neutral-400/30 text-primary">Features</a>
                        <a className="px-2 md:px-3 py-1 rounded-xl hover:bg-neutral-200/50 dark:hover:bg-neutral-400/30 duration-150 hover:transform hover:-translate-y-1 transition-transform duration-200">About</a>

                        <button className="transition-colors duration-300 hover:transform hover:-translate-y-1 transition-transform duration-200" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                            {theme === 'dark' ? <SunIcon size={24} /> : <MoonIcon size={24} />}
                        </button>

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

                        <button className="flex gap-2.5 px-3 py-2 rounded-3xl hover:opacity-75 transition-opacity duration-300 bg-secondary text-secondary-foreground items-center hover:transform hover:-translate-y-1 transition-transform duration-200">
                            <TelegramLogoIcon size={20} />
                            Start Now
                        </button>
                    </div>
                )}
            </header>

            {/* Hero Section */}
            <section className="mt-8 md:mt-12 lg:mt-14 w-full text-center">
                <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                    Powerful Features for <br />
                    <span className="text-primary">Content Creators</span>
                </h1>
                <p className="mt-6 md:mt-8 text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                    Discover all the tools and capabilities that make SHOWPLS the ultimate platform for monetizing your content and connecting with your audience worldwide.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mt-8 md:mt-12 items-center justify-center">
                    <button className="flex items-center gap-2 px-6 py-3 rounded-3xl transition-all duration-150 bg-primary text-primary-foreground hover:opacity-75 hover:transform hover:-translate-y-1 font-medium">
                        <TelegramLogoIcon size={24} />
                        Get Started Today
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 rounded-3xl border-2 transition-all duration-150 border-primary text-card-foreground dark:text-primary hover:bg-primary hover:text-black hover:dark:text-black hover:transform hover:-translate-y-1 font-medium">
                        <EyeIcon size={24} />
                        Watch Demo
                    </button>
                </div>
            </section>

            {/* Core Features Section */}
            <section className="mt-20 md:mt-40 w-full">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">Core Features</h2>
                    <p className="mt-4 text-lg md:text-xl text-muted-foreground">
                        Everything you need to succeed as a content creator
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <Card className="bg-card-foreground dark:bg-primary border-none group hover:transform hover:-translate-y-2 transition-all duration-300">
                        <CardContent className="p-8 text-center">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary dark:bg-card-foreground flex items-center justify-center mb-6">
                                <LightningIcon size={32} className="text-white dark:text-black" />
                            </div>
                            <CardTitle className="text-2xl mb-4 text-white dark:text-black">
                                Real-Time Payments
                            </CardTitle>
                            <p className="text-white dark:text-black opacity-90 leading-relaxed">
                                Receive payments instantly from your audience with lightning-fast cryptocurrency transactions. No waiting periods, no delays.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card dark:bg-card-foreground border-none group hover:transform hover:-translate-y-2 transition-all duration-300">
                        <CardContent className="p-8 text-center">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-card-foreground dark:bg-primary flex items-center justify-center mb-6">
                                <CameraIcon size={32} className="text-white dark:text-black" />
                            </div>
                            <CardTitle className="text-2xl mb-4 dark:text-white text-black">
                                Live Streaming
                            </CardTitle>
                            <p className="text-muted-foreground leading-relaxed">
                                Stream live content directly to your audience with crystal-clear quality and interactive features that keep viewers engaged.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card dark:bg-card-foreground border-none group hover:transform hover:-translate-y-2 transition-all duration-300">
                        <CardContent className="p-8 text-center">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-card-foreground dark:bg-primary flex items-center justify-center mb-6">
                                <GlobeIcon size={32} className="text-white dark:text-black" />
                            </div>
                            <CardTitle className="text-2xl mb-4 dark:text-white text-black">
                                Global Reach
                            </CardTitle>
                            <p className="text-muted-foreground leading-relaxed">
                                Connect with audiences worldwide through our global network. Break geographical barriers and expand your reach.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Advanced Features */}
            <section className="mt-20 md:mt-40 w-full">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">Advanced Capabilities</h2>
                    <p className="mt-4 text-lg md:text-xl text-muted-foreground">
                        Professional tools for serious content creators
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                    <div className="flex flex-col gap-6">
                        <div className="flex items-start gap-4 p-6 rounded-2xl bg-secondary hover:transform hover:-translate-y-1 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                                <WalletIcon size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Integrated Telegram Wallet</h3>
                                <p className="text-muted-foreground">
                                    Built-in cryptocurrency wallet that integrates seamlessly with Telegram for secure transactions.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-6 rounded-2xl bg-secondary hover:transform hover:-translate-y-1 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
                                <VerifiedIcon size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Verified Community</h3>
                                <p className="text-muted-foreground">
                                    Join a trusted network of verified creators and viewers, ensuring safety and authenticity.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-6 rounded-2xl bg-secondary hover:transform hover:-translate-y-1 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                                <ClockIcon size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">24/7 Availability</h3>
                                <p className="text-muted-foreground">
                                    Stream and earn around the clock with our always-on platform infrastructure.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="flex items-start gap-4 p-6 rounded-2xl bg-secondary hover:transform hover:-translate-y-1 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0">
                                <DeviceTabletSpeakerIcon size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Multi-Device Support</h3>
                                <p className="text-muted-foreground">
                                    Stream from any device - mobile, tablet, or desktop. Switch seamlessly between platforms.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-6 rounded-2xl bg-secondary hover:transform hover:-translate-y-1 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center flex-shrink-0">
                                <MoneyIcon size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Multiple Revenue Streams</h3>
                                <p className="text-muted-foreground">
                                    Earn through tips, subscriptions, private shows, and premium content sales.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-6 rounded-2xl bg-secondary hover:transform hover:-translate-y-1 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center flex-shrink-0">
                                <ShieldIcon size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Advanced Security</h3>
                                <p className="text-muted-foreground">
                                    Bank-grade encryption and security protocols to protect your earnings and privacy.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Payment Features */}
            <section className="mt-20 md:mt-40 w-full">
                <div className="bg-gradient-to-br from-primary/10 to-emerald-600/10 rounded-3xl p-8 md:p-12 lg:p-16">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">Payment Innovation</h2>
                        <p className="mt-4 text-lg md:text-xl text-muted-foreground">
                            Revolutionary payment system built for the digital age
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto rounded-2xl bg-primary flex items-center justify-center mb-6">
                                <CreditCardIcon size={40} className="text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-4">Instant Transactions</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Payments processed in seconds with blockchain technology. No bank delays or processing fees.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto rounded-2xl bg-emerald-600 flex items-center justify-center mb-6">
                                <BankIcon size={40} className="text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-4">Low Fees</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Keep more of what you earn with our ultra-low transaction fees and transparent pricing.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto rounded-2xl bg-blue-600 flex items-center justify-center mb-6">
                                <GlobeIcon size={40} className="text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-4">Global Currency</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Earn in cryptocurrency that works anywhere in the world. No currency conversion needed.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Comparison Section */}
            <section className="mt-20 md:mt-40 w-full">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">Why Choose SHOWPLS?</h2>
                    <p className="mt-4 text-lg md:text-xl text-muted-foreground">
                        See how we compare to traditional platforms
                    </p>
                </div>

                <div className="bg-card rounded-3xl p-8 md:p-12 border">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold mb-6">Traditional Platforms</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <XIcon size={20} className="text-red-500 flex-shrink-0" />
                                    <span>High commission fees (20-50%)</span>
                                </div>
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <XIcon size={20} className="text-red-500 flex-shrink-0" />
                                    <span>Delayed payments (weeks)</span>
                                </div>
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <XIcon size={20} className="text-red-500 flex-shrink-0" />
                                    <span>Limited global reach</span>
                                </div>
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <XIcon size={20} className="text-red-500 flex-shrink-0" />
                                    <span>Complex withdrawal process</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-center border-x border-border px-8">
                            <h3 className="text-2xl font-bold mb-6 text-primary">SHOWPLS</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-foreground">
                                    <CheckCircleIcon size={20} className="text-emerald-500 flex-shrink-0" />
                                    <span className="font-medium">Ultra-low fees (2-5%)</span>
                                </div>
                                <div className="flex items-center gap-3 text-foreground">
                                    <CheckCircleIcon size={20} className="text-emerald-500 flex-shrink-0" />
                                    <span className="font-medium">Instant payments</span>
                                </div>
                                <div className="flex items-center gap-3 text-foreground">
                                    <CheckCircleIcon size={20} className="text-emerald-500 flex-shrink-0" />
                                    <span className="font-medium">Global cryptocurrency</span>
                                </div>
                                <div className="flex items-center gap-3 text-foreground">
                                    <CheckCircleIcon size={20} className="text-emerald-500 flex-shrink-0" />
                                    <span className="font-medium">Integrated Telegram wallet</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-center">
                            <h3 className="text-2xl font-bold mb-6">Other Crypto Platforms</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <XIcon size={20} className="text-red-500 flex-shrink-0" />
                                    <span>Complex setup process</span>
                                </div>
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <XIcon size={20} className="text-red-500 flex-shrink-0" />
                                    <span>Technical knowledge required</span>
                                </div>
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <XIcon size={20} className="text-red-500 flex-shrink-0" />
                                    <span>Limited community features</span>
                                </div>
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <XIcon size={20} className="text-red-500 flex-shrink-0" />
                                    <span>Poor user experience</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="mt-20 md:mt-40 flex flex-col items-center text-center gap-6">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">Ready to Get Started?</h2>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
                    Join thousands of creators who are already earning with SHOWPLS. Start your journey today.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <button className="font-medium flex gap-2.5 px-6 py-3 rounded-3xl hover:opacity-75 transition-opacity duration-300 bg-primary text-primary-foreground items-center hover:transform hover:-translate-y-1 transition-transform duration-200">
                        <TelegramLogoIcon size={24} />
                        Start Earning Now
                    </button>
                    <button className="font-medium flex gap-2.5 px-6 py-3 rounded-3xl hover:opacity-75 transition-opacity duration-300 bg-secondary text-secondary-foreground items-center hover:transform hover:-translate-y-1 transition-transform duration-200">
                        <EyeIcon size={24} />
                        View Pricing
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="mt-20 md:mt-32 w-full py-12 border-t border-border">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-600">
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
                            The future of content monetization, powered by blockchain technology and built for creators.
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
                        <div>© 2024 SHOWPLS. All rights reserved.</div>
                        <div className="flex gap-4 md:gap-6">
                            <span>Privacy Policy</span>
                            <span>Terms of Service</span>
                            <span>Cookie Policy</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default FeaturesLanding;