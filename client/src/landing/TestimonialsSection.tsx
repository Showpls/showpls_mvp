import { Card } from "@/components/ui/card";
import { StarIcon, UsersIcon } from "@phosphor-icons/react/dist/ssr";
import { useTranslation } from "react-i18next";

export default function TestimonialsSection() {

    const { t } = useTranslation();

    return (
        <section className="mt-20 md:mt-40 w-full">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">{t('testimonials.title')}</h2>

            <div className="mt-12 flex flex-col lg:flex-row gap-8 md:gap-12 items-center">
                <div className="w-full lg:w-[66%]">
                    <h3 className="text-2xl md:text-3xl font-bold">{t('testimonials.subtitle')}</h3>
                    <div className="flex gap-1 mt-4">
                        {[...Array(5)].map((_, i) => (
                            <StarIcon key={i} weight="fill" size={21} className="text-yellow-400" />
                        ))}
                    </div>
                    <p className="mt-8 text-lg md:text-xl text-muted-foreground">
                        {t('testimonials.testimonialText')}
                    </p>
                </div>

                <div className="w-full lg:w-[34%] space-y-6">
                    <Card className="bg-secondary border-none p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="text-xl font-medium text-secondary-foreground">Dimon Oshparennyy</div>
                                <div className="text-black">CEO of Filming Studio</div>
                            </div>
                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-muted text-background">
                                <UsersIcon size={24} />
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-secondary border-none p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="text-xl font-medium text-secondary-foreground">Danila Bogrov</div>
                                <div className="text-black">Youtube Content Creator</div>
                            </div>
                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-muted text-background">
                                <UsersIcon size={24} />
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-secondary border-none p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="text-xl font-medium text-secondary-foreground">Sasha Belii</div>
                                <div className="text-black">Professional Photographer</div>
                            </div>
                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-muted text-background">
                                <UsersIcon size={24} />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </section>
    )
}