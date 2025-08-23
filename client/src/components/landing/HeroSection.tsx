import { useState } from "react";
import { CameraIcon } from "@phosphor-icons/react/dist/csr/Camera";
import { EyeIcon } from "@phosphor-icons/react/dist/csr/Eye";
import ReactPlayer from 'react-player'
import { Button } from "../ui/button";
import { useTranslation } from "react-i18next";

export default function HeroSection() {
    const { t, i18n } = useTranslation();

    const videoSources = {
        en: "/videos/showpls-demo-en.mp4",
        ru: "/videos/showpls-demo-ru.mp4"
    };

    const currentLang = i18n.language?.toLowerCase().startsWith("ru") ? "ru" : "en";

    return (
        <section className="container-full min-h-[36rem] md:h-svh md:max-h-[min(80rem,300vw)] md:min-h-[48rem] px-4 pb-0 pt-16 text-foreground md:px-6 md:pb-0 lg:pt-28">
            <div className="relative h-full w-full rounded-2xl overflow-hidden border bg-card">
                <div className="relative h-full flex flex-col lg:flex-row items-center">
                    <img className="rounded-lg z-0 absolute left-0 top-0 h-full w-full object-cover opacity-20" src="/grainy4.jpg" />
                    <div className="w-full lg:w-1/2 z-10 flex flex-col justify-center px-6 md:px-12 lg:px-16 py-8 md:py-12">
                        <div className="mb-4">
                            <h1 className="text-[clamp(2.5rem,_1.4rem_+_6vw,_6rem)] font-semibold leading-[1.2] tracking-tight text-balance text-center lg:text-left">
                                {t('hero.tagline')}
                            </h1>
                        </div>

                        <div className="mb-4">
                            <p className="text-xl md:text-2xl leading-relaxed text-balance text-foreground/90 text-center lg:text-left">
                                {t('hero.subtitle')}
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row">
                            <a href="https://t.me/showplsbot" target="_blank" rel="noopener noreferrer" className="contents">
                                <Button size="lg" className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                                    <EyeIcon />
                                    {t('hero.seeCta')}
                                </Button>
                            </a>

                            <a href="https://t.me/showplsbot" target="_blank" rel="noopener noreferrer" className="contents">
                                <Button size="lg" variant="secondary" className="inline-flex items-center justify-center gap-3 rounded-md border border-border px-4 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/90">
                                    <CameraIcon size={26} />
                                    <span>{t('hero.showCta')}</span>
                                </Button>
                            </a>
                        </div>
                    </div>

                    <div className="z-10 w-full lg:w-1/2 p-4 md:p-12 mt-4 lg:mt-0">
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl">
                            <ReactPlayer
                                src={videoSources[currentLang]}
                                playing
                                muted
                                loop
                                width="100%"
                                height="100%"
                                className="absolute top-0 left-0"
                                style={{ objectFit: 'cover' }}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}