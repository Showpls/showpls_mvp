// Icons
import { StarIcon } from "@phosphor-icons/react/dist/csr/Star"

export default function TestimonialsSection() {
    const testimonials = [
        {
            name: "Sarah Chen",
            avatar: "/avatar-1.jpg",
            content: "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable."
        },
        {
            name: "Marcus Rodriguez",
            avatar: "/avatar-2.jpg",
            content: "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable."
        },
        {
            name: "Elena Kowalski",
            avatar: "/avatar-3.jpg",
            content: "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable."
        }
    ]

    return (
        <section className="w-full my-20 lg:my-32">
            {/* Section Header */}
            <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                    Testimonials
                </h2>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Side - Current Review Text */}
                <div className="lg:w-1/2">
                    <div className="bg-secondary rounded-2xl p-6 h-full">
                        <p className="text-foreground text-base leading-relaxed mb-6">
                            "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable."
                        </p>

                        {/* Rating */}
                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                                <StarIcon key={i} size={16} className="text-yellow-500 fill-current" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side - Profile Cards */}
                <div className="lg:w-1/2">
                    <div className="space-y-4">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={index}
                                className="bg-secondary rounded-xl p-4 flex items-center gap-4 hover:bg-secondary/80 transition-colors cursor-pointer"
                            >
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/20 flex-shrink-0">
                                    <img
                                        src={testimonial.avatar}
                                        alt={testimonial.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-foreground font-medium text-base truncate">
                                        {testimonial.name}
                                    </h4>
                                    <div className="flex items-center gap-1 mt-1">
                                        {[...Array(5)].map((_, i) => (
                                            <StarIcon key={i} size={12} className="text-yellow-500 fill-current" />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}