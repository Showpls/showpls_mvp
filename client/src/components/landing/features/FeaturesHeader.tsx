import { useTranslation } from "react-i18next";

export default function FeaturesHeader() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-2xl text-center mb-8 md:mb-10">
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-3 md:mb-4">
        {/** i18n: features section header title */}
        {t("landing.featuresSection.header.title")}
      </h2>
      <p className="text-base sm:text-lg leading-7 sm:leading-8 text-muted-foreground">
        {/** i18n: features section header subtitle */}
        {t("landing.featuresSection.header.subtitle")}
      </p>
    </div>
  );
}
