import ReactPlayer from "react-player";
import {
    MediaController,
    MediaControlBar,
    MediaTimeRange,
    MediaTimeDisplay,
    MediaVolumeRange,
    MediaPlaybackRateButton,
    MediaPlayButton,
    MediaSeekBackwardButton,
    MediaSeekForwardButton,
    MediaMuteButton,
    MediaFullscreenButton,
} from "media-chrome/react";
// Icons
import { EyeIcon } from "@phosphor-icons/react/dist/csr/Eye"
import { WebcamIcon } from "@phosphor-icons/react/dist/csr/Webcam"

export default function HeroSection() {
    return (
        <section className="flex flex-col lg:flex-row lg:justify-between lg:items-center w-full my-13 gap-8 lg:gap-12">
            {/* Left Content */}
            <div className="flex flex-col gap-6 lg:gap-10 lg:flex-1">
                <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold leading-tight">
                    Your Eyes Everywhere
                </h1>
                <p className="text-muted text-lg md:text-xl font-medium leading-relaxed max-w-2xl">
                    Get real-time visual verification from people around the world. Request photos, videos, or live streams of any place, product, or event.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-7">
                    <button className="bg-primary flex items-center justify-center gap-2 py-3 px-6 border-none rounded-2xl text-primary-foreground hover:bg-primary/90 transition-colors">
                        <EyeIcon size={24} />
                        <p className="font-medium text-lg">I want to see</p>
                    </button>
                    <button className="flex items-center justify-center gap-2 py-3 px-6 border-2 border-primary text-primary rounded-2xl hover:bg-primary hover:text-primary-foreground duration-200 transition-colors">
                        <WebcamIcon size={24} />
                        <p className="font-medium text-lg">I can show</p>
                    </button>
                </div>
            </div>

            {/* Right Video Player */}
            <div className="lg:flex-1 lg:max-w-[540px] w-full">
                <MediaController className="w-full aspect-video rounded-2xl overflow-hidden">
                    <ReactPlayer
                        slot="media"
                        src="/videos/showpls-demo-ru.mp4"
                        controls={false}
                        width="100%"
                        height="100%"
                        style={{
                            width: "100%",
                            height: "100%",
                        }}
                    />
                    <MediaControlBar className="media-control-bar">
                        <MediaPlayButton />
                        <MediaSeekBackwardButton seekOffset={10} />
                        <MediaSeekForwardButton seekOffset={10} />
                        <MediaTimeRange />
                        <MediaTimeDisplay showDuration />
                        <MediaMuteButton />
                        <MediaVolumeRange />
                        <MediaPlaybackRateButton />
                        <MediaFullscreenButton />
                    </MediaControlBar>
                </MediaController>
            </div>
        </section>
    )
}