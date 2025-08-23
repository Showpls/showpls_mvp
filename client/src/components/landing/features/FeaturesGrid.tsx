import { ClockIcon } from "@phosphor-icons/react/dist/csr/Clock";
import { GlobeHemisphereWestIcon } from "@phosphor-icons/react/dist/csr/GlobeHemisphereWest";
import { ShieldCheckIcon } from "@phosphor-icons/react/dist/csr/ShieldCheck";
import FeatureCard from "./FeatureCard";
import { useTranslation } from "react-i18next";

export default function FeaturesGrid() {
  const { t } = useTranslation();
  const features = [
    {
      icon: <ClockIcon size={26} />,
      title: t("landing.featuresSection.grid.realTime.title"),
      description: t("landing.featuresSection.grid.realTime.description"),
      highlight: t("landing.featuresSection.grid.realTime.highlight"),
    },
    {
      icon: <GlobeHemisphereWestIcon size={26} />,
      title: t("landing.featuresSection.grid.globalNetwork.title"),
      description: t("landing.featuresSection.grid.globalNetwork.description"),
      highlight: t("landing.featuresSection.grid.globalNetwork.highlight"),
    },
    {
      icon: <ShieldCheckIcon size={26} />,
      title: t("landing.featuresSection.grid.verified.title"),
      description: t("landing.featuresSection.grid.verified.description"),
      highlight: t("landing.featuresSection.grid.verified.highlight"),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 xl:gap-10">
      {features.map((f, i) => (
        <FeatureCard
          key={i}
          icon={f.icon}
          title={f.title}
          description={f.description}
          highlight={f.highlight}
        />)
      )}
    </div>
  );
}
