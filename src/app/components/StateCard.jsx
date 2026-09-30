import { motion } from "framer-motion";
import SkylabLoader from "./SkylabLoader";

const cardVariants = {
    initial: { opacity: 0, y: 28, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -26, scale: 0.98, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } },
};

const TONE_ICON_COLOR = {
    neutral: "text-neutral-200",
    danger: "text-red-400",
    warning: "text-amber-400",
    brand: "text-skylab-300",
};

export default function StateCard({ title, description, Icon, isLoading, tone = "neutral", meta, children }) {
    const iconColor = TONE_ICON_COLOR[tone] ?? TONE_ICON_COLOR.neutral;

    return (
        <div className="flex-1 flex items-center justify-center w-full">
            <motion.div variants={cardVariants} initial="initial" animate="animate" exit="exit"
                className="mx-auto flex w-full max-w-md flex-col items-center px-6 text-center"
            >
                {isLoading ? (
                    <SkylabLoader size={80} color="#e5e5e5" />
                ) : Icon ? (
                    <Icon className={`h-9 w-9 ${iconColor} drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)]`} />
                ) : null}

                <div className="mt-4 flex flex-col gap-2 text-balance">
                    <p className="text-sm font-semibold text-neutral-100">{title}</p>
                    {description ? (
                        <p className="text-xs leading-relaxed text-neutral-400">{description}</p>
                    ) : null}
                </div>

                {meta ? <div className="mt-4">{meta}</div> : null}
                {children ? <div className="mt-5 w-full">{children}</div> : null}
            </motion.div>
        </div>
    );
}
