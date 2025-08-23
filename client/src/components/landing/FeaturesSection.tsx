import FeaturesHeader from "./features/FeaturesHeader";
import FeaturesGrid from "./features/FeaturesGrid";

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-background">
      <div className="mx-auto px-4 md:px-6 space-y-12 md:space-y-16">
        <FeaturesHeader />
        <FeaturesGrid />
      </div>
    </section>
  );
}