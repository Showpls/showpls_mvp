import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { GlobeIcon, LightningIcon, SealCheckIcon, TelegramLogoIcon, WalletIcon } from "@phosphor-icons/react/dist/ssr";
import { useTranslation } from "react-i18next";

export default function HowItWorksSection() {

    const { t } = useTranslation();

    return (
        <section className="mt-20 md:mt-40 w-full">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-center lg:text-left text-3xl md:text-4xl lg:text-5xl font-bold">{t('features.title')}</h2>
                    <p className="text-center lg:text-left mt-2 text-base md:text-lg text-muted-foreground">
                        {t('features.subtitle')}
                    </p>
                </div>
                <a href="https://t.me/showplsbot" target="_blank">
                    <button className="font-medium flex gap-2.5 px-3 py-2 rounded-3xl hover:opacity-75 duration-200 bg-secondary text-secondary-foreground items-center hover:transform hover:-translate-y-1 transition-all">
                        <TelegramLogoIcon size={24} />
                        {t('header.start')}
                    </button>
                </a>
            </div>

            {/* Features Cards Section */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-card-foreground dark:bg-primary border-none">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                        <div>
                            <div className="w-14 h-14 rounded-xl flex items-center justify-center">
                                <LightningIcon size={48} className="text-white dark:text-black" />
                            </div>
                            <CardTitle className="mt-6 text-2xl md:text-3xl text-white dark:text-black">
                                {t('features.realTimePayments')}
                            </CardTitle>
                            <p className="mt-4 text-white dark:text-black font-medium">
                                {t('features.realTimeDescription')}
                            </p>
                        </div>
                        <a href="https://t.me/showplsbot" target="_blank">
                            <button className="mt-8 bg-primary dark:bg-card-foreground px-4 py-1 font-medium rounded-3xl transition-all duration-200 w-fit text-black dark:text-white hover:opacity-75 hover:transform hover:-translate-y-1">
                                {t('features.startNow')}
                            </button>
                        </a>
                    </CardContent>
                </Card>

                <Card className="bg-card-foreground dark:bg-primary border-none">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                        <div>
                            <div className="w-14 h-14 rounded-xl flex items-center justify-center">
                                <GlobeIcon size={48} className="text-white dark:text-black" />
                            </div>
                            <CardTitle className="mt-6 text-2xl md:text-3xl text-white dark:text-black">
                                {t('features.globalNetwork')}
                            </CardTitle>
                            <p className="mt-4 text-white dark:text-black font-medium">
                                {t('features.globalDescription')}
                            </p>
                        </div>
                        <a href="https://t.me/showplsbot" target="_blank">
                            <button className="mt-8 bg-primary dark:bg-card-foreground px-4 py-1 font-medium rounded-3xl transition-all duration-150 w-fit text-black dark:text-white hover:opacity-75 hover:transform hover:-translate-y-1">
                                {t('features.startNow')}
                            </button>
                        </a>
                    </CardContent>
                </Card>

                <Card className="bg-card-foreground dark:bg-primary border-none">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                        <div>
                            <div className="w-14 h-14 rounded-xl flex items-center justify-center">
                                <WalletIcon size={48} className="text-white dark:text-black" />
                            </div>
                            <CardTitle className="mt-6 text-2xl md:text-3xl text-white dark:text-black">
                                {t('features.telegramWallet')}
                            </CardTitle>
                            <p className="mt-4 text-white dark:text-black font-medium">
                                {t('features.walletDescription')}
                            </p>
                        </div>
                        <a href="https://t.me/showplsbot" target="_blank">
                            <button className="mt-8 bg-primary dark:bg-card-foreground px-4 py-1 font-medium rounded-3xl transition-all duration-200 w-fit text-black dark:text-white hover:opacity-75 hover:transform hover:-translate-y-1">
                                {t('features.startNow')}
                            </button>
                        </a>
                    </CardContent>
                </Card>

                <Card className="bg-card-foreground dark:bg-primary border-none">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                        <div>
                            <div className="w-14 h-14 rounded-xl flex items-center justify-center">
                                <SealCheckIcon size={48} className="text-white dark:text-black" />
                            </div>
                            <CardTitle className="mt-6 text-2xl md:text-3xl text-white dark:text-black">
                                {t('features.verifiedCommunity')}
                            </CardTitle>
                            <p className="mt-4 text-white dark:text-black font-medium">
                                {t('features.verifiedDescription')}
                            </p>
                        </div>
                        <a href="https://t.me/showplsbot" target="_blank">
                            <button className="mt-8 bg-primary dark:bg-card-foreground px-4 py-1 font-medium rounded-3xl transition-all duration-200 w-fit text-black dark:text-white hover:opacity-75 hover:transform hover:-translate-y-1">
                                {t('features.startNow')}
                            </button>
                        </a>
                    </CardContent>
                </Card>
            </div>
        </section>
    )
}