import { Card } from "@/components/ui/card";
import { StarIcon, CaretLeftIcon, CaretRightIcon, NewspaperClippingIcon, BuildingsIcon, SuitcaseRollingIcon } from "@phosphor-icons/react/dist/ssr";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";

export default function TestimonialsSection() {
    const { t } = useTranslation();
    const [activeIndex, setActiveIndex] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Updated testimonial data with subtitles
    const testimonials = [
        {
            name: "Maria L.",
            role: "Investigative Reporter",
            subtitle: t('testimonials.subtitle1'),
            text: t('testimonials.testimonialText1'),
            icon: NewspaperClippingIcon
        },
        {
            name: "David K.",
            role: "Real Estate Investor",
            subtitle: t('testimonials.subtitle2'),
            text: t('testimonials.testimonialText2'),
            icon: BuildingsIcon
        },
        {
            name: "Sofia M.",
            role: "Traveler",
            subtitle: t('testimonials.subtitle3'),
            text: t('testimonials.testimonialText3'),
            icon: SuitcaseRollingIcon
        }
    ];

    // Function to start/reset the auto-rotation timer
    const startTimer = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % testimonials.length);
        }, 8000);
    };

    // Auto-rotate testimonials every 8 seconds
    useEffect(() => {
        startTimer();

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [testimonials.length]);

    const nextTestimonial = () => {
        setActiveIndex((prev) => (prev + 1) % testimonials.length);
        startTimer(); // Reset timer on manual navigation
    };

    const prevTestimonial = () => {
        setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
        startTimer(); // Reset timer on manual navigation
    };

    return (
        <section id="testimonials" className="mt-20 md:mt-40 w-full">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">{t('testimonials.title')}</h2>

            <div className="mt-12 flex flex-col lg:flex-row gap-8 md:gap-12 items-center">
                <div className="w-full lg:w-[66%]">
                    {/* Single animated container for all testimonial content */}
                    <div className="relative min-h-[300px] overflow-hidden">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={index}
                                className={`absolute top-0 left-0 w-full transition-all duration-700 ease-in-out ${index === activeIndex
                                    ? 'opacity-100 translate-y-0'
                                    : index < activeIndex
                                        ? 'opacity-0 -translate-y-8'
                                        : 'opacity-0 translate-y-8'
                                    }`}
                            >
                                {/* Subtitle */}
                                <h3 className="text-2xl md:text-3xl font-bold">
                                    {testimonial.subtitle}
                                </h3>

                                {/* Stars */}
                                <div className="flex gap-1 mt-4">
                                    {[...Array(5)].map((_, i) => (
                                        <StarIcon key={i} weight="fill" size={21} className="text-yellow-400" />
                                    ))}
                                </div>

                                {/* Testimonial text */}
                                <div className="mt-8">
                                    <p className="text-lg md:text-xl text-muted-foreground">
                                        {testimonial.text}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Navigation arrows */}
                    <div className="flex gap-4 mt-6">
                        <button
                            onClick={prevTestimonial}
                            className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                            aria-label="Previous testimonial"
                        >
                            <CaretLeftIcon size={24} />
                        </button>
                        <button
                            onClick={nextTestimonial}
                            className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                            aria-label="Next testimonial"
                        >
                            <CaretRightIcon size={24} />
                        </button>
                    </div>
                </div>

                <div className="w-full lg:w-[34%] space-y-6">
                    {testimonials.map((testimonial, index) => (
                        <Card
                            key={index}
                            className={`border-none p-6 transition-all duration-300 cursor-pointer ${index === activeIndex
                                ? 'bg-primary text-primary-foreground scale-105 shadow-lg'
                                : 'bg-secondary text-secondary-foreground opacity-80 hover:opacity-100'
                                }`}
                            onClick={() => {
                                setActiveIndex(index);
                                startTimer(); // Reset timer when clicking on a testimonial card
                            }}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className={`text-xl font-medium ${index === activeIndex ? 'text-primary-foreground' : 'text-secondary-foreground'
                                        }`}>
                                        {testimonial.name}
                                    </div>
                                    <div className={index === activeIndex ? 'text-primary-foreground/80' : 'text-black'}>
                                        {testimonial.role}
                                    </div>
                                </div>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${index === activeIndex
                                    ? 'bg-primary-foreground text-primary'
                                    : 'bg-muted text-background'
                                    }`}>
                                    <testimonial.icon size={24} />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}