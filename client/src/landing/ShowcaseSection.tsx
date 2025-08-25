// Icons
import { ArrowRightIcon } from "@phosphor-icons/react/dist/csr/ArrowRight"

export default function ShowcaseSection() {
    return (
        <section className="w-full my-20 lg:my-32">
            {/* Top Section */}
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 mb-20">
                {/* Left Side - Single Image with Man */}
                <div className="lg:flex-1 flex justify-center lg:justify-start">
                    <div className="w-[280px] md:w-[320px] h-[200px] md:h-[240px] rounded-2xl overflow-hidden shadow-lg">
                        <img
                            src="/man-with-camera.jpg"
                            alt="Man with camera"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Center Content with Squiggly Line and Arrow */}
                <div className="lg:flex-1 flex flex-col items-center relative">
                    {/* Squiggly Line - Rotated 24 degrees */}
                    <div className="hidden lg:block mb-4">
                        <img
                            src="/squiggly-line.svg"
                            alt="Decorative line"
                            className="w-24 h-12 opacity-60 transform rotate-[24deg]"
                        />
                    </div>

                    <div className="text-center mb-4">
                        <h3 className="text-lg font-medium text-foreground mb-2">
                            Earn real money
                        </h3>
                        <p className="text-sm text-muted">
                            for photo submissions
                        </p>
                    </div>

                    <ArrowRightIcon size={24} className="text-foreground" />
                </div>

                {/* Right Side - Stacked Images */}
                <div className="lg:flex-1 flex justify-center lg:justify-end">
                    <div className="relative">
                        {/* Back Image */}
                        <div className="w-[200px] h-[120px] rounded-xl bg-gray-300 shadow-lg transform rotate-2 absolute -top-2 -right-2">
                            <img
                                src="/showcase-image-3.jpg"
                                alt="Showcase 3"
                                className="w-full h-full object-cover rounded-xl"
                            />
                        </div>

                        {/* Middle Image */}
                        <div className="w-[200px] h-[120px] rounded-xl bg-gray-200 shadow-lg transform -rotate-1 absolute -top-1 -right-1">
                            <img
                                src="/showcase-image-2.jpg"
                                alt="Showcase 2"
                                className="w-full h-full object-cover rounded-xl"
                            />
                        </div>

                        {/* Front Image */}
                        <div className="w-[200px] h-[120px] rounded-xl bg-white shadow-xl relative z-10">
                            <img
                                src="/showcase-image-1.jpg"
                                alt="Showcase 1"
                                className="w-full h-full object-cover rounded-xl"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section - Reversed */}
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-16">
                {/* Right Side - Single Image */}
                <div className="lg:flex-1 flex justify-center lg:justify-end">
                    <div className="w-[280px] md:w-[320px] h-[200px] md:h-[240px] rounded-2xl overflow-hidden shadow-lg">
                        <img
                            src="/verification-image.jpg"
                            alt="Verification example"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Center Content */}
                <div className="lg:flex-1 flex flex-col items-center relative">
                    <div className="text-center mb-4">
                        <h3 className="text-lg font-medium text-foreground mb-2">
                            From anywhere in the world
                        </h3>
                    </div>

                    <div className="hidden lg:block">
                        <img
                            src="/squiggly-line.svg"
                            alt="Decorative line"
                            className="w-24 h-12 opacity-60 transform rotate-[24deg]"
                        />
                    </div>
                </div>

                {/* Left Side - Multiple Images */}
                <div className="lg:flex-1 flex justify-center lg:justify-start">
                    <div className="relative">
                        <div className="w-[200px] h-[120px] rounded-xl bg-white shadow-xl">
                            <img
                                src="/world-locations.jpg"
                                alt="World locations"
                                className="w-full h-full object-cover rounded-xl"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}