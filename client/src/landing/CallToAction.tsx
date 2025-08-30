import { TelegramLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { useTranslation } from "react-i18next";

export default function CallToActionSection() {

    const { t } = useTranslation();

    return (
        <section className="mt-20 md:mt-40 flex flex-col items-center text-center gap-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">{t('cta.title')}</h2>
            <p className="text-lg md:text-xl text-muted-foreground">
                {t('cta.subtitle')}
            </p>
            <a href="https://t.me/showplsbot" target="_blank">
                <button className="font-medium flex gap-2.5 px-3 py-2 rounded-3xl hover:opacity-75 transition-all duration-200 bg-primary text-secondary-foreground items-center hover:transform hover:-translate-y-1">
                    <TelegramLogoIcon size={24} />
                    {t('header.start')}
                </button>
            </a>
        </section>
    )
}