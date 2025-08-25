"use client"
import { useState } from "react"
// Icons
import { ListIcon } from "@phosphor-icons/react/dist/csr/List"
import { SunIcon } from "@phosphor-icons/react/dist/csr/Sun"
import { TranslateIcon } from "@phosphor-icons/react/dist/csr/Translate"
import { TelegramLogoIcon } from "@phosphor-icons/react/dist/csr/TelegramLogo"
import { MoonIcon } from "@phosphor-icons/react/dist/csr/Moon"
import { XIcon } from "@phosphor-icons/react/dist/csr/X"
// Hooks
import { useIsMobile } from "@/hooks/use-mobile"
import { useTheme } from "next-themes"

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const isMobile: boolean = useIsMobile()
    const { theme, setTheme } = useTheme()

    function handleChangeTheme() {
        if (theme === "dark") {
            setTheme("light");
        } else {
            setTheme("dark");
        }
    }

    return (
        <>
            <header className="flex items-center justify-between text-foreground my-9 md:my-13 w-full relative z-50">
                {/* Left Side */}
                <div>
                    <div className="flex items-center gap-2 md:gap-4 lg:gap-6">
                        <div className="w-[37px] md:w-[50px] h-[37px] md:h-[50px] rounded-xl bg-emerald-600 flex items-center justify-center">
                            {isMobile ? (
                                <img src="/logo4.png" width={31} height={31} />
                            ) : (
                                <img src="/logo4.png" width={42} height={42} />
                            )}
                        </div>
                        <h3 className="text-3xl font-bold">SHOWPLS</h3>
                    </div>
                </div>

                {/* Right Side */}
                <div>
                    {isMobile ? (
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2"
                        >
                            {mobileMenuOpen ? <XIcon size={36} /> : <ListIcon size={36} />}
                        </button>
                    ) : (
                        <div className="flex items-center gap-[22px]">
                            <a className="text-2xl font-medium py-2 px-3 rounded-lg hover:bg-neutral-400/40 transition-colors duration-200 cursor-pointer">Home</a>
                            <a className="text-2xl font-medium py-2 px-3 rounded-lg hover:bg-neutral-400/40 transition-colors duration-200 cursor-pointer">About</a>
                            <a className="text-2xl font-medium py-2 px-3 rounded-lg hover:bg-neutral-400/40 transition-colors duration-200 cursor-pointer">Features</a>
                            <button onClick={handleChangeTheme}>
                                {theme === "dark" ? (
                                    <SunIcon size={26} />
                                ) : (
                                    <MoonIcon size={26} />
                                )}
                            </button>
                            <button>
                                <TranslateIcon size={26} />
                            </button>
                            <button className="bg-secondary rounded-[20px] py-2 px-3 flex items-center gap-2 hover:bg-secondary/80 transition-colors">
                                <TelegramLogoIcon size={26} />
                                <p className="text-2xl font-medium">Start</p>
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobile && mobileMenuOpen && (
                <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-40 flex flex-col pt-32 px-6">
                    <div className="flex flex-col gap-6">
                        <a className="text-3xl font-medium py-4 px-3 rounded-lg hover:bg-neutral-400/40 transition-colors duration-200 cursor-pointer">Home</a>
                        <a className="text-3xl font-medium py-4 px-3 rounded-lg hover:bg-neutral-400/40 transition-colors duration-200 cursor-pointer">About</a>
                        <a className="text-3xl font-medium py-4 px-3 rounded-lg hover:bg-neutral-400/40 transition-colors duration-200 cursor-pointer">Features</a>

                        <div className="flex items-center justify-between py-4 px-3">
                            <span className="text-2xl font-medium">Theme</span>
                            <button onClick={handleChangeTheme} className="p-2">
                                {theme === "dark" ? (
                                    <SunIcon size={28} />
                                ) : (
                                    <MoonIcon size={28} />
                                )}
                            </button>
                        </div>

                        <div className="flex items-center justify-between py-4 px-3">
                            <span className="text-2xl font-medium">Language</span>
                            <button className="p-2">
                                <TranslateIcon size={28} />
                            </button>
                        </div>

                        <button className="bg-secondary rounded-[20px] py-4 px-6 flex items-center justify-center gap-3 mt-6 hover:bg-secondary/80 transition-colors">
                            <TelegramLogoIcon size={28} />
                            <p className="text-2xl font-medium">Start</p>
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}