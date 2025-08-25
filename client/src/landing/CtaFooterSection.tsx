// Icons
import { TelegramLogoIcon } from "@phosphor-icons/react/dist/csr/TelegramLogo"
import { TwitterLogoIcon } from "@phosphor-icons/react/dist/csr/TwitterLogo"
import { DiscordLogoIcon } from "@phosphor-icons/react/dist/csr/DiscordLogo"
import { GithubLogoIcon } from "@phosphor-icons/react/dist/csr/GithubLogo"
import { EyeIcon } from "@phosphor-icons/react/dist/csr/Eye"
import { WebcamIcon } from "@phosphor-icons/react/dist/csr/Webcam"

export default function CtaFooterSection() {
    return (
        <section className="w-full">
            {/* Call to Action */}
            <div className="bg-primary rounded-3xl py-16 px-8 lg:px-12 text-center my-20 relative overflow-hidden">
                {/* Background Pattern/Decoration */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-20 h-20 border-2 border-primary-foreground rounded-full"></div>
                    <div className="absolute bottom-10 right-10 w-16 h-16 border-2 border-primary-foreground rounded-full"></div>
                    <div className="absolute top-1/2 left-20 w-8 h-8 bg-primary-foreground rounded-full"></div>
                    <div className="absolute top-20 right-1/3 w-12 h-12 bg-primary-foreground rounded-full"></div>
                </div>

                <div className="relative z-10 max-w-4xl mx-auto">
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-primary-foreground">
                        Ready to start?
                    </h2>
                    <p className="text-primary-foreground/90 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
                        Join thousands of users who are already experiencing the power of global visual verification
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <button className="bg-background text-foreground flex items-center gap-3 py-4 px-8 rounded-2xl text-lg font-medium hover:bg-background/90 transition-colors shadow-lg min-w-[200px] justify-center">
                            <EyeIcon size={24} />
                            I want to see
                        </button>
                        <button className="border-2 border-background text-background flex items-center gap-3 py-4 px-8 rounded-2xl text-lg font-medium hover:bg-background hover:text-foreground transition-colors min-w-[200px] justify-center">
                            <WebcamIcon size={24} />
                            I can show
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-border pt-16 pb-8 mt-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand Column */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center">
                                <img src="/logo4.png" width={32} height={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground">SHOWPLS</h3>
                        </div>
                        <p className="text-muted text-lg leading-relaxed max-w-md mb-8">
                            Your eyes everywhere. Get real-time visual verification from people around the world.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="#" className="text-muted hover:text-foreground transition-colors p-2">
                                <TelegramLogoIcon size={24} />
                            </a>
                            <a href="#" className="text-muted hover:text-foreground transition-colors p-2">
                                <TwitterLogoIcon size={24} />
                            </a>
                            <a href="#" className="text-muted hover:text-foreground transition-colors p-2">
                                <DiscordLogoIcon size={24} />
                            </a>
                            <a href="#" className="text-muted hover:text-foreground transition-colors p-2">
                                <GithubLogoIcon size={24} />
                            </a>
                        </div>
                    </div>

                    {/* Links Column 1 */}
                    <div>
                        <h4 className="text-lg font-bold text-foreground mb-6">Product</h4>
                        <ul className="space-y-4">
                            <li><a href="#" className="text-muted hover:text-foreground transition-colors">Features</a></li>
                            <li><a href="#" className="text-muted hover:text-foreground transition-colors">How it works</a></li>
                            <li><a href="#" className="text-muted hover:text-foreground transition-colors">Pricing</a></li>
                            <li><a href="#" className="text-muted hover:text-foreground transition-colors">API</a></li>
                        </ul>
                    </div>

                    {/* Links Column 2 */}
                    <div>
                        <h4 className="text-lg font-bold text-foreground mb-6">Company</h4>
                        <ul className="space-y-4">
                            <li><a href="#" className="text-muted hover:text-foreground transition-colors">About us</a></li>
                            <li><a href="#" className="text-muted hover:text-foreground transition-colors">Blog</a></li>
                            <li><a href="#" className="text-muted hover:text-foreground transition-colors">Support</a></li>
                            <li><a href="#" className="text-muted hover:text-foreground transition-colors">Contact</a></li>
                        </ul>
                    </div>
                </div>

                {/* Footer Bottom */}
                <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-muted text-sm">
                        © 2025 Showpls. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <a href="#" className="text-muted hover:text-foreground transition-colors text-sm">
                            Privacy Policy
                        </a>
                        <a href="#" className="text-muted hover:text-foreground transition-colors text-sm">
                            Terms of Service
                        </a>
                    </div>
                </div>
            </footer>
        </section>
    )
}