import { Button } from "@/components/ui/button"
import { CaretDownIcon, ListIcon, MoonIcon, SunIcon, XIcon, TranslateIcon, TelegramLogoIcon } from "@phosphor-icons/react/dist/ssr"
import { useState } from "react";
import { useTranslation } from "react-i18next";

const languages = [
    { code: 'en', label: '🇺🇸 EN', name: 'English' },
    { code: 'ru', label: '🇷🇺 RU', name: 'Русский' },
    { code: 'es', label: '🇪🇸 ES', name: 'Español' },
    { code: 'zh', label: '🇨🇳 ZH', name: '中文' },
    { code: 'ar', label: '🇸🇦 AR', name: 'العربية' },
];

export default function Header(props: any) {

    const { theme, setTheme, isMobile, isTablet, setIsMobileMenuOpen, isMobileMenuOpen } = props

    const { t, i18n } = useTranslation();
    const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');
    const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);


    const handleLanguageChange = (languageCode: string) => {
        setCurrentLanguage(languageCode);
        i18n.changeLanguage(languageCode);
        localStorage.setItem('showpls-language', languageCode);
        setHeaderDropdownOpen(false);
    };

    return (
        <header className="flex justify-between items-center w-full py-4" >
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

            {
                isMobile || isTablet ? (
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
                                        className="transition-all text-foreground hover:transform hover:-translate-y-1 duration-200"
                                    >
                                        <XIcon size={36} />
                                    </Button>
                                </div>

                                <nav className="flex flex-col items-baseline gap-6 text-2xl font-medium">
                                    <a>{t('header.home')}</a>
                                    <a>{t("header.howItWorks")}</a>
                                    <a>{t("header.useCases")}</a>
                                    <a>{t('header.aiVision')}</a>
                                    <a>{t('header.community')}</a>
                                    <a>{t('header.learnMore')}</a>
                                    <a>{t('header.joinTestnet')}</a>

                                    <div className="flex gap-6">
                                        <button className="hover:transform hover:-translate-y-1 transition-all duration-200" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                                            {theme === 'dark' ? <SunIcon size={26} /> : <MoonIcon size={26} />}
                                        </button>

                                        {/* Mobile Language Dropdown */}
                                        <div className="relative">
                                            <button
                                                className="transition-all text-foreground flex items-center gap-1 hover:transform hover:-translate-y-1 duration-200"
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

                                    <button className="flex items-center gap-2.5 px-4 py-1 rounded-3xl transition-all bg-secondary text-secondary-foreground hover:transform hover:-translate-y-1 duration-200">
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
                        <a className="px-2 md:px-3 py-1 rounded-xl hover:bg-neutral-200/50 dark:hover:bg-neutral-400/30 duration-150 hover:transform hover:-translate-y-1 transition-all">{t("header.howItWorks")}</a>
                        <a className="px-2 md:px-3 py-1 rounded-xl hover:bg-neutral-200/50 dark:hover:bg-neutral-400/30 duration-150 hover:transform hover:-translate-y-1 transition-all">{t("header.useCases")}</a>
                        <a className="px-2 md:px-3 py-1 rounded-xl hover:bg-neutral-200/50 dark:hover:bg-neutral-400/30 duration-150 hover:transform hover:-translate-y-1 transition-all">{t('header.aiVision')}</a>
                        <a className="px-2 md:px-3 py-1 rounded-xl hover:bg-neutral-200/50 dark:hover:bg-neutral-400/30 duration-150 hover:transform hover:-translate-y-1 transition-all">{t('header.community')}</a>
                        <a className="px-2 md:px-3 py-1 rounded-xl hover:bg-neutral-200/50 dark:hover:bg-neutral-400/30 duration-150 hover:transform hover:-translate-y-1 transition-all">{t('header.learnMore')}</a>
                        <a className="px-2 md:px-3 py-1 rounded-xl hover:bg-neutral-200/50 dark:hover:bg-neutral-400/30 duration-150 hover:transform hover:-translate-y-1 transition-all">{t('header.joinTestnet')}</a>


                        <button className="transition-all duration-200 hover:transform hover:-translate-y-1 " onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                            {theme === 'dark' ? <SunIcon size={24} /> : <MoonIcon size={24} />}
                        </button>

                        {/* Desktop Language Dropdown */}
                        <div className="relative">
                            <button
                                className="transition-all duration-200 text-foreground flex items-center gap-1 hover:transform hover:-translate-y-1"
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
                            <button className="flex gap-2.5 px-3 py-2 rounded-3xl hover:opacity-75 transition-all bg-secondary text-secondary-foreground items-center hover:transform hover:-translate-y-1 duration-200">
                                <TelegramLogoIcon size={20} />
                                {t('header.start')}
                            </button>
                        </a>

                    </div>
                )
            }
        </header >
    )
}