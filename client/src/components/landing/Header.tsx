import { useState, useEffect } from "react";
import { TelegramLogoIcon } from "@phosphor-icons/react/dist/csr/TelegramLogo";
import { Button } from "../ui/button";

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
            if (isMenuOpen) setIsMenuOpen(false);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isMenuOpen]);

    const links = ["Readme", "Contact", "About", "Policy", "Demo"];

    return (
        <nav className="fixed top-3 z-40 w-full sm:top-4 lg:top-6">
            <div className="container box-border mx-auto max-w-7xl px-4 md:px-6">
                <div
                    className={`relative flex h-14 sm:h-16 w-full items-center justify-between rounded-lg border px-2 py-1.5 
          transition-[box-shadow,background-color,border-color] duration-300 motion-reduce:transition-none 
          lg:grid lg:grid-cols-[1fr_auto_1fr] lg:rounded-2xl lg:py-[0.4375rem] lg:pr-[0.4375rem]
          ${
                        isScrolled
                            ? 'border-border bg-background shadow-xl :bg-background/60'
                            : 'border-transparent bg-transparent'
                    }
        `}
                >

                    {/* Logo and title - Left side */}
                    <a className="relative flex w-fit items-center gap-2 overflow-hidden lg:px-3" href="/">
                        <img src="/logo4.png" className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10" alt="SHOWPLS" />
                        <h2 className="font-bold text-base sm:text-lg lg:text-xl text-foreground">SHOWPLS</h2>
                    </a>

                    {/* Navigation links - Center (hidden on mobile) */}
                    <ul className="col-start-2 gap-5 px-2 font-medium text-muted-foreground xl:gap-6 hidden lg:flex">
                        {links.map((link, index) => (
                            <li key={index}>
                                <a
                                    className="transition-colors duration-300 p-2 hover:text-foreground hover:bg-muted rounded-md motion-reduce:transition-none cursor-pointer"
                                    href={`/${link.toLowerCase()}`}
                                >
                                    {link}
                                </a>
                            </li>
                        ))}
                    </ul>

                    {/* Right side - Button and mobile menu */}
                    <div className="col-start-3 flex w-full items-center justify-end gap-2">
                        {/* Start button */}
                        <a
                            target="_blank"
                            href="https://t.me/showplsbot"
                            rel="noopener noreferrer"
                            className="hidden md:inline-flex items-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
                        >
                            <TelegramLogoIcon size={16} />
                            Start
                        </a>

                        {/* Mobile menu button (visible on mobile only) */}
                        <button
                            className="relative size-9 lg:hidden ml-1 sm:ml-2 flex items-center justify-center"
                            aria-expanded={isMenuOpen}
                            aria-controls="mobile-menu"
                            aria-label="Menu"
                            onClick={() => setIsMenuOpen((v) => !v)}
                        >
                            <svg
                                className="size-7 text-muted-foreground"
                                viewBox="0 0 24 24"
                                width="24"
                                xmlns="http://www.w3.org/2000/svg"
                                strokeWidth="2.2"
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M4 6h16" />
                                <path d="M4 12h16" />
                                <path d="M4 18h16" />
                            </svg>
                        </button>
                    </div>
                    {/* Mobile dropdown panel */}
                    <div
                        id="mobile-menu"
                        className={`${isMenuOpen ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 -translate-y-1'} lg:hidden absolute left-2 right-2 top-full mt-2 z-50 rounded-md border border-border bg-background shadow-lg transition-all`}
                        role="menu"
                        aria-hidden={!isMenuOpen}
                    >
                        <ul className="p-1.5">
                            <li className="p-1">
                                <a
                                    href="https://t.me/showplsbot"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                                    onClick={() => setIsMenuOpen(false)}
                                    role="menuitem"
                                >
                                    <TelegramLogoIcon size={14} />
                                    Start
                                </a>
                            </li>
                            {links.map((link, index) => (
                                <li key={index}>
                                    <a
                                        className="block w-full rounded-[0.5rem] px-3 py-2 text-sm text-foreground/90 hover:bg-muted"
                                        href={`/${link.toLowerCase()}`}
                                        onClick={() => setIsMenuOpen(false)}
                                        role="menuitem"
                                    >
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </nav>
    );
}