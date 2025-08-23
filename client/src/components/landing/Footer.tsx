import React from "react";
import { TwitterLogoIcon } from "@phosphor-icons/react/dist/csr/TwitterLogo";
import { GithubLogoIcon } from "@phosphor-icons/react/dist/csr/GithubLogo";
import { DiscordLogoIcon } from "@phosphor-icons/react/dist/csr/DiscordLogo";
import { YoutubeLogoIcon } from "@phosphor-icons/react/dist/csr/YoutubeLogo";

export default function Footer() {
  const footerLinks = {
    Product: [
      { name: "How it works", href: "/#how-it-works" },
      { name: "Use cases", href: "/#use-cases" },
      { name: "Pricing", href: "/pricing" },
      { name: "Mobile app", href: "/app" },
    ],
    Resources: [
      { name: "Documentation", href: "/docs" },
      { name: "API", href: "/api" },
      { name: "Support", href: "/support" },
      { name: "Community", href: "/community" },
    ],
    Company: [
      { name: "About", href: "/about" },
      { name: "Careers", href: "/careers" },
      { name: "Contact", href: "/contact" },
      { name: "Privacy", href: "/privacy" },
      { name: "Terms", href: "/terms" },
    ],
  } as const;

  const social = [
    { name: "Twitter", href: "https://twitter.com/", icon: TwitterLogoIcon },
    { name: "GitHub", href: "https://github.com/", icon: GithubLogoIcon },
    { name: "Discord", href: "https://discord.gg/", icon: DiscordLogoIcon },
    { name: "YouTube", href: "https://youtube.com/", icon: YoutubeLogoIcon },
  ] as const;

  return (
    <footer className="bg-background border-t border-border py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-primary rounded-md flex items-center justify-center overflow-hidden">
                <img src="/logo4.png" alt="Showpls logo" className="w-7 h-7 object-contain" />
              </div>
              <span className="text-xl font-bold text-foreground">Showpls</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              On-demand, geo-verified photos and videos from real people anywhere in the world.
            </p>
            <div className="flex gap-3 mt-5">
              {social.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  aria-label={s.name}
                  className="inline-flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                >
                  <s.icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="sm:max-w-xs">
              <h3 className="text-xs uppercase tracking-wider text-foreground/80 mb-4">{category}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Showpls. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </a>
            <a href="/cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}