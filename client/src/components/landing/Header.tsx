import { useState, useEffect } from "react";
import { TelegramLogoIcon } from "@phosphor-icons/react/dist/csr/TelegramLogo";
import { Button } from "../ui/button";

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const links = ["Readme", "Contact", "About", "Policy", "Demo"];

    return (
        <nav className="fixed top-4 z-40 w-full lg:top-6">
            <div className="container box-border mx-auto max-w-7xl px-4 md:px-6">
                <div
                    className={`relative flex h-16 w-full items-center justify-between rounded-lg border px-2 py-1.5 
          transition-[box-shadow,background-color,border-color] duration-300 motion-reduce:transition-none 
          lg:grid lg:grid-cols-[1fr_auto_1fr] lg:rounded-2xl lg:py-[0.4375rem] lg:pr-[0.4375rem]
          ${
                        isScrolled
                            ? 'border-border bg-background shadow-xl :bg-background/60 shadow-sm'
                            : 'border-transparent bg-transparent'
                    }
        `}
                >

                    {/* Logo and title - Left side */}
                    <a className="relative flex w-fit items-center gap-2 overflow-hidden lg:px-3" href="/">
                        <img src="/logo4.png" className="h-8 w-8 lg:h-10 lg:w-10" alt="SHOWPLS" />
                        <h2 className="font-bold text-lg lg:text-xl text-foreground">SHOWPLS</h2>
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
                    <div className="col-start-3 flex w-full justify-end gap-2">
                        {/* Start button */}
                        <a
                            target="_blank"
                            href="https://t.me/showplsbot"
                            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
                        >
                            <TelegramLogoIcon size={16} />
                            Start
                        </a>

                        {/* Mobile menu button (visible on mobile only) */}
                        <button
                            className="relative size-6 lg:hidden ml-2"
                            aria-expanded="false"
                            aria-controls="mobile-menu"
                            aria-label="Menu"
                        >
                            <svg
                                className="-ml-2 -mt-2 size-10 text-muted-foreground"
                                viewBox="0 0 100 100"
                                width="24"
                                xmlns="http://www.w3.org/2000/svg"
                                strokeWidth="5.5"
                                fill="none"
                                stroke="currentColor"
                            >
                                <path d="m 70,33 h -40 c 0,0 -8.5,-0.149796 -8.5,8.5 0,8.649796 8.5,8.5 8.5,8.5 h 20 v -20"></path>
                                <path d="m 70,50 h -40"></path>
                                <path d="m 30,67 h 40 c 0,0 8.5,0.149796 8.5,-8.5 0,-8.649796 -8.5,-8.5 -8.5,-8.5 h -20 v 20"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}