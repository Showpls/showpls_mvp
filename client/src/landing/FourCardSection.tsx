// Icons
import { ClockIcon } from "@phosphor-icons/react/dist/csr/Clock"
import { GlobeIcon } from "@phosphor-icons/react/dist/csr/Globe"
import { ShieldCheckIcon } from "@phosphor-icons/react/dist/csr/ShieldCheck"
import { CurrencyDollarIcon } from "@phosphor-icons/react/dist/csr/CurrencyDollar"

export default function WhyShowplsSection() {
    const features = [
        {
            icon: <ClockIcon size={24} />,
            title: "Real-Time Requests",
            description: "Get what you need instantly with our global community network.",
            isDark: true
        },
        {
            icon: <GlobeIcon size={24} />,
            title: "Global Network",
            description: "Connect with people anywhere in the world for visual content.",
            isDark: false
        },
        {
            icon: <ShieldCheckIcon size={24} />,
            title: "Verified Submissions",
            description: "All content is verified and timestamped for authenticity.",
            isDark: false
        },
        {
            icon: <CurrencyDollarIcon size={24} />,
            title: "Earn & Learn",
            description: "Contributors earn rewards while requesters get insights.",
            isDark: false
        }
    ]

    return (
        <section className="w-full my-20 lg:my-32">
            {/* Section Header */}
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                    Why use Showpls?
                </h2>
                <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary/90 transition-colors">
                    Start
                </button>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {features.map((feature, index) => (
                    <div
                        key={index}
                        className={`${feature.isDark
                                ? 'bg-foreground text-background'
                                : 'bg-primary text-foreground'
                            } rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300`}
                    >
                        <div className="flex flex-col h-full">
                            {/* Icon */}
                            <div className="mb-4">
                                {feature.icon}
                            </div>

                            {/* Title */}
                            <h3 className="text-lg font-bold mb-3">
                                {feature.title}
                            </h3>

                            {/* Description */}
                            <p className={`text-sm leading-relaxed flex-1 mb-6 ${feature.isDark ? 'text-background/80' : 'text-foreground/80'
                                }`}>
                                {feature.description}
                            </p>

                            {/* Button */}
                            <button className={`${feature.isDark
                                    ? 'bg-background text-foreground hover:bg-background/90'
                                    : 'bg-foreground text-background hover:bg-foreground/90'
                                } px-4 py-2 rounded-xl text-sm font-medium transition-colors w-fit`}>
                                Learn More
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}