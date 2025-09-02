import { Button } from "@/components/ui/button"
import { ShieldIcon, TranslateIcon, UsersIcon } from "@phosphor-icons/react/dist/ssr"
import { useTranslation } from "react-i18next";

export default function Footer(props: any) {

    const { isMobile, theme } = props

    const { t } = useTranslation();

    return (
        <footer className="w-full py-12 border-t border-border">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
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
                    <p className="max-w-xs text-muted-foreground">
                        {t('footer.description')}
                    </p>
                    <div className="flex gap-4">
                        <Button variant="ghost" size="icon" className="w-10 h-10 transition-all duration-200 bg-muted text-background hover:transform hover:-translate-y-1">
                            <TranslateIcon size={20} />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-10 h-10 transition-all duration-200 bg-muted text-background hover:transform hover:-translate-y-1">
                            <UsersIcon size={20} />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-10 h-10 transition-all duration-200 bg-muted text-background hover:transform hover:-translate-y-1">
                            <ShieldIcon size={20} />
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 md:gap-16 text-muted-foreground">
                    <div>{t('footer.copyright')}</div>
                    <div className="flex gap-4 md:gap-6">
                        <span>{t('footer.privacy')}</span>
                        <span>{t('footer.terms')}</span>
                        <span>{t('footer.cookies')}</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}