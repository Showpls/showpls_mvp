import { Button } from "@/components/ui/button";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/csr/ArrowUpRight";

export default function FeaturesCTA() {
  return (
    <section className="py-16">
      <div className="mx-auto px-4 md:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card/80 p-8 md:p-10 bg-popover text-popover-foreground shadow-md">
          {/* background accents */}
          <div className="pointer-events-none absolute inset-0">
          </div>
          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-semibold md:font-bold text-foreground mb-3 md:mb-4 tracking-tight">
              Get eyes on the ground — anywhere
            </h3>
            <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8">
              Make a request and receive geo-context visuals in minutes. Join the global marketplace that rewards local knowledge.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <a target="_blank" href="https://t.me/showplsbot">
                    <Button size="lg">Open In Telegram <ArrowUpRightIcon size={32} /></Button>
                </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
