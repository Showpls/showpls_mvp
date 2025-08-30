import { useTranslation } from "react-i18next";
import { useState } from "react";
import { EyeIcon, TranslateIcon, WebcamIcon } from "@phosphor-icons/react/dist/ssr";

export default function HeroSection() {

    const { t, i18n } = useTranslation();

    const [videoDropdownOpen, setVideoDropdownOpen] = useState(false);
    const [videoLanguage, setVideoLanguage] = useState('en');

    const handleVideoLanguageChange = (languageCode: string) => {
        setVideoLanguage(languageCode);
        setVideoDropdownOpen(false);
    };

    return (
        <section id="home" className="mt-8 md:mt-12 lg:mt-14 w-full">
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
                            className="bg-background/90 hover:bg-background text-foreground rounded-full p-2 transition-all duration-200 flex items-center justify-center shadow-md hover:transform hover:-translate-y-1"
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
    )
}