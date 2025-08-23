import { ClockIcon } from "@phosphor-icons/react/dist/csr/Clock";
import { GlobeHemisphereWestIcon } from "@phosphor-icons/react/dist/csr/GlobeHemisphereWest";
import { ShieldCheckIcon } from "@phosphor-icons/react/dist/csr/ShieldCheck";
import FeatureCard from "./FeatureCard";

export default function FeaturesGrid() {
  const features = [
    {
      icon: <ClockIcon size={26} />,
      title: "Real-time",
      description: "Get instant visual verification from people worldwide",
      highlight: "Median response under 5 mins",
    },
    {
      icon: <GlobeHemisphereWestIcon size={26} />,
      title: "Global Network",
      description: "Connect with local reporters in any city",
      highlight: "190+ countries covered",
    },
    {
      icon: <ShieldCheckIcon size={26} />,
      title: "Verified",
      description: "Trusted community with ratings and reviews",
      highlight: "Geo + reputation backed",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
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
