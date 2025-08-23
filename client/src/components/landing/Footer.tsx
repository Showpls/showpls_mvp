import React from "react";
import { TwitterLogoIcon } from "@phosphor-icons/react/dist/csr/TwitterLogo";
import { GithubLogoIcon } from "@phosphor-icons/react/dist/csr/GithubLogo";
import { DiscordLogoIcon } from "@phosphor-icons/react/dist/csr/DiscordLogo";
import { YoutubeLogoIcon } from "@phosphor-icons/react/dist/csr/YoutubeLogo";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  const footerSections = [
    {
      key: "product",
      title: t("landing.footer.categories.product"),
      links: [
        { label: t("landing.footer.links.howItWorks"), href: "/#how-it-works" },
        { label: t("landing.footer.links.useCases"), href: "/#use-cases" },
        { label: t("landing.footer.links.pricing"), href: "/pricing" },
        { label: t("landing.footer.links.mobileApp"), href: "/app" },
      ],
    },
    {
      key: "resources",
      title: t("landing.footer.categories.resources"),
      links: [
        { label: t("landing.footer.links.documentation"), href: "/docs" },
        { label: t("landing.footer.links.api"), href: "/api" },
        { label: t("landing.footer.links.support"), href: "/support" },
        { label: t("landing.footer.links.community"), href: "/community" },
      ],
    },
    {
      key: "company",
      title: t("landing.footer.categories.company"),
      links: [
        { label: t("landing.footer.links.about"), href: "/about" },
        { label: t("landing.footer.links.careers"), href: "/careers" },
        { label: t("landing.footer.links.contact"), href: "/contact" },
        { label: t("landing.footer.links.privacy"), href: "/privacy" },
        { label: t("landing.footer.links.terms"), href: "/terms" },
      ],
    },
  ] as const;

  const social = [
    { name: "Twitter", href: "https://twitter.com/", icon: TwitterLogoIcon },
    { name: "GitHub", href: "https://github.com/", icon: GithubLogoIcon },
    { name: "Discord", href: "https://discord.gg/", icon: DiscordLogoIcon },
    { name: "YouTube", href: "https://youtube.com/", icon: YoutubeLogoIcon },
  ] as const;

  return (
    <footer className="bg-background border-t border-border py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-primary rounded-md flex items-center justify-center overflow-hidden">
                <img src="/logo4.png" alt={t("landing.footer.altLogo")} className="w-7 h-7 object-contain" />
              </div>
              <span className="text-xl font-bold text-foreground">Showpls</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              {t("landing.footer.brandDescription")}
            </p>
            <div className="flex gap-3 mt-5">
              {social.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  aria-label={s.name}
                  className="inline-flex size-10 sm:size-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                >
                  <s.icon size={18} className="sm:size-[16px]" />
                </a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.key} className="sm:max-w-xs">
              <h3 className="text-xs uppercase tracking-wider text-foreground/80 mb-4">{section.title}</h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">{t("landing.footer.copyright", { year: new Date().getFullYear() })}</p>
          <div className="flex gap-6">
            <a href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("landing.footer.links.privacy")}
            </a>
            <a href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("landing.footer.links.terms")}
            </a>
            <a href="/cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("landing.footer.links.cookies")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}