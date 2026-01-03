import { motion } from "framer-motion";

const cardVariants = {
    initial: { opacity: 0, y: 28, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -26, scale: 0.98, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } },
};

export default function StateCard({ title, description, Icon, isLoading }) {
    return (
        <div className="flex-1 flex items-center justify-center w-full">
            <motion.div variants={cardVariants} initial="initial" animate="animate" exit="exit"
                className="mx-auto flex w-full max-w-lg flex-col items-center gap-5 px-6 text-center"
            >
                <Icon className={`text-neutral-200 h-10 w-10 drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)] ${isLoading ? "animate-spin" : ""}`} />
                <div className="flex flex-col gap-2 text-balance">
                    <p className="text-md font-semibold text-neutral-100">{title}</p>
                    <p className="text-xs text-neutral-400">{description}</p>
                </div>
            </motion.div>
        </div>
    )
}