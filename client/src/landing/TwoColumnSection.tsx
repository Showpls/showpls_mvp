import { ArrowElbowDownLeftIcon, ArrowFatLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { useTranslation } from "react-i18next";

export default function TwoColumnSection(props: any) {

    const { isMobile, isTablet, theme } = props

    const { t } = useTranslation();

    return (
        <section className="mt-20 md:mt-40 w-full">
            {!isMobile && !isTablet ? (
                /* DESKTOP LAYOUT - Fixed height issue */
                <div className="relative flex items-stretch justify-between gap-8">
                    {/* LEFT IMAGE - flexible, allowed to shrink/grow */}
                    <div className="flex-shrink-0 basis-[22%] max-w-[340px] min-w-[160px]">
                        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg">
                            <img src="/cameraMan.jpg" alt="Camera man" className="w-full h-full object-cover" />
                        </div>
                    </div>

                    {/* CENTER CONTENT - vertically centered */}
                    <div className="flex-1 flex flex-col justify-center items-center relative py-8">
                        {/* Top row (right aligned) */}
                        <div className="w-full flex justify-end">
                            <div className="flex items-center gap-6 lg:gap-10">
                                <div className="hidden lg:block">
                                    <ArrowFatLeftIcon weight="fill" size={64} className="text-black dark:text-white" />
                                </div>
                                <div className="text-right text-4xl font-bold leading-tight max-w-[56ch]">
                                    {t('earnSection.earnText')}
                                </div>
                            </div>
                        </div>

                        {/* Squiggly - container reserves vertical space so it isn't purely floating */}
                        <div className="w-full py-8 md:py-10">
                            <div className="relative w-full" style={{ height: '5rem' }}>
                                <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full">
                                    {theme === "light" ? (
                                        <img
                                            src="/squigglyLine.webp"
                                            alt=""
                                            className="mx-auto w-full max-w-[420px] md:max-w-[520px] rotate-[24deg] select-none"
                                            aria-hidden
                                        />
                                    ) : (
                                        <img
                                            src="/squigglyLineDarkMode.png"
                                            alt=""
                                            className="mx-auto w-full max-w-[420px] md:max-w-[520px] rotate-[24deg] select-none"
                                            aria-hidden
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bottom row (left aligned) */}
                        <div className="w-full flex justify-start mt-4">
                            <div className="flex items-center gap-6 lg:gap-10">
                                <div className="text-left text-4xl font-bold leading-tight max-w-[56ch]">
                                    {t('earnSection.anywhereText')}
                                </div>
                                <div className="hidden lg:block">
                                    <ArrowFatLeftIcon
                                        weight="fill"
                                        size={64}
                                        className="text-black dark:text-white transform scale-x-[-1]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT STACKED IMAGES - flexible */}
                    <div className="flex-shrink-0 w-1/2 max-w-[260px] min-w-[120px] h-[510px]">
                        <div className="w-full h-full rounded-2xl overflow-hidden shadow-lg">
                            <div className="grid grid-rows-3 h-full">
                                <div className="overflow-hidden h-full">
                                    <img src="/smartphone.jpg" alt="New York" className="w-full h-full object-cover" />
                                </div>
                                <div className="overflow-hidden h-full">
                                    <img src="/camera.jpg" alt="London" className="w-full h-full object-cover" />
                                </div>
                                <div className="overflow-hidden h-full">
                                    <img src="/drone.jpg" alt="China" className="w-full h-full object-cover" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* MOBILE / TABLET LAYOUT (camera left, text+arrow right [column centered], squiggly below, reversed bottom row with stacked images on right) */
                <div className="relative w-full max-w-5xl mx-auto">
                    <div className="flex items-center gap-4 w-full">
                        {/* LEFT: cameraMan */}
                        <div className="flex-shrink-0 w-1/2 max-w-[260px] min-w-[120px] h-72 md:h-96">
                            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg">
                                <img src="/cameraMan.jpg" alt="Camera man" className="w-full h-full object-cover" />
                            </div>
                        </div>

                        {/* RIGHT: text above arrow, centered column */}
                        <div className="flex-1 flex flex-col items-center justify-center gap-3">
                            <div className="font-bold text-center leading-tight text-2xl md:text-3xl">
                                {t('earnSection.earnText')}
                            </div>
                            <div>
                                <ArrowElbowDownLeftIcon
                                    weight="fill"
                                    size={isTablet ? 74 : 96}
                                    className="text-black dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Squiggly reserved space below the top row */}
                    <div className="relative w-full mt-4 md:mt-6">
                        <div className="h-24 md:h-32 w-full relative">
                            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full">
                                {theme === "light" ? (
                                    <img
                                        src="/squigglyLine.webp"
                                        alt=""
                                        className="mx-auto w-full max-w-[420px] md:max-w-[540px] rotate-[24deg] select-none"
                                        aria-hidden
                                    />
                                ) : (
                                    <img
                                        src="/squigglyLineDarkMode.png"
                                        alt=""
                                        className="mx-auto w-full max-w-[420px] md:max-w-[540px] rotate-[24deg] select-none"
                                        aria-hidden
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM ROW: reversed - text+arrow left (centered column), stacked images right with same height as cameraMan */}
                    <div className="mt-4 md:mt-6 flex items-center gap-4 w-full">
                        {/* left: text over arrow, centered */}
                        <div className="flex-1 flex flex-col items-center justify-center gap-3">
                            <div className="font-bold text-center leading-tight text-2xl md:text-3xl">
                                {t('earnSection.anywhereText')}
                            </div>
                            <div>
                                <ArrowElbowDownLeftIcon
                                    weight="fill"
                                    size={isTablet ? 74 : 96}
                                    className="text-black dark:text-white transform scale-x-[-1]"
                                />
                            </div>
                        </div>

                        {/* right: stacked images - same height as cameraMan */}
                        <div className="flex-shrink-0 w-1/2 max-w-[260px] min-w-[120px] h-72 md:h-96">
                            <div className="w-full h-full rounded-2xl overflow-hidden shadow-lg">
                                <div className="grid grid-rows-3 h-full">
                                    <div className="overflow-hidden h-full">
                                        <img src="/smartphone.jpg" alt="New York" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="overflow-hidden h-full">
                                        <img src="/camera.jpg" alt="London" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="overflow-hidden h-full">
                                        <img src="/drone.jpg" alt="China" className="w-full h-full object-cover" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}