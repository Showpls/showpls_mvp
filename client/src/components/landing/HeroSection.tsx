import { useState } from "react";
import { CameraIcon } from "@phosphor-icons/react/dist/csr/Camera";
import { EyeIcon } from "@phosphor-icons/react/dist/csr/Eye";
import ReactPlayer from 'react-player'
import { Button } from "../ui/button";

export default function HeroSection() {
    const [videoLanguage, setVideoLanguage] = useState("en");

    const videoSources = {
        en: "/videos/showpls-demo-en.mp4",
        ru: "/videos/showpls-demo-ru.mp4"
    };

    const handleLanguageChange = (language: string) => {
        setVideoLanguage(language);
    };

    return (
        <section className="container-full min-h-[40rem] md:h-svh md:max-h-[min(80rem,300vw)] md:min-h-[48rem] px-4 pb-0 pt-24 text-foreground md:px-6 md:pb-0 lg:pt-28">
            <div className="relative h-full w-full rounded-2xl overflow-hidden border bg-card">
                <div className="relative h-full flex items-center">
                    <img className="rounded-lg z-0 absolute left-0 top-0 h-full w-full object-cover opacity-20" src="/grainy4.jpg" />
                    <div className="w-full lg:w-1/2 z-10 flex flex-col justify-center px-8 md:px-12 lg:px-16">
                        <div className="mb-4">
                            <h1 className="text-[clamp(3.625rem,_1.6250rem_+_8.3333vw,_7rem)] font-semibold leading-[0.95] tracking-tight text-balance">
                                Your Eyes Anywhere
                            </h1>
                        </div>

                        <div className="mb-4">
                            <p className="text-xl md:text-2xl leading-relaxed text-balance text-foreground/90">
                                Instantly get photos or videos of any place from people worldwide.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 md:flex-row">
                            <Button size="lg" className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                                <EyeIcon />
                                I want to see
                            </Button>

                            <Button size="lg" variant="secondary" className="inline-flex items-center justify-center gap-3 rounded-md border border-border px-4 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/90">
                                <CameraIcon size={26} />
                                <span>I can show</span>
                            </Button>
                        </div>
                    </div>

                    <div className="z-10 w-full lg:w-1/2 p-8 md:p-12">
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl">
                            <ReactPlayer
                                src="/videos/showpls-demo-en.mp4"
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