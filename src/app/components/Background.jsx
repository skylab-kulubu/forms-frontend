import { motion, useReducedMotion } from "framer-motion";

export default function Background() {
  const reduce = useReducedMotion();

  const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { delay: 0.2, duration: 1.2, ease: "easeInOut" },
  };

  const blob1Anim = reduce
    ? { x: 0, y: 0, scale: 1 }
    : { x: [0, 50, -30, 0], y: [0, -50, 30, 0], scale: [1, 1.05, 0.97, 1] };

  const blob2Anim = reduce
    ? { x: 0, y: 0, scale: 1 }
    : { x: [0, -60, 40, 0], y: [0, 60, -40, 0], scale: [1, 0.95, 1.07, 1] };

  return (
    <div className="fixed inset-0 z-0 w-full h-full overflow-hidden flex items-center justify-center pointer-events-none">
      <motion.div initial={fadeIn.initial} animate={fadeIn.animate} transition={fadeIn.transition} className="relative w-full h-full">
        <motion.div
          className="absolute -top-[10%] -left-[20%] w-[70vw] h-[70vw] min-w-[600px] min-h-[600px] will-change-transform transform-[translateZ(0)]"
          animate={blob1Anim} transition={{ duration: 14, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
        >
          <div className="w-full h-full rounded-full mix-blend-screen bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.22),transparent_78%)] blur-[80px]" />
        </motion.div>

        <motion.div
          className="absolute -bottom-[20%] -right-[10%] w-[80vw] h-[80vw] min-w-[700px] min-h-[700px] will-change-transform transform-[translateZ(0)]"
          animate={blob2Anim} transition={{ duration: 18, ease: "easeInOut", repeat: Infinity, repeatType: "mirror", delay: 0.35 }}
        >
          <div className="w-full h-full rounded-full mix-blend-screen bg-[radial-gradient(ellipse_at_bottom_right,rgba(236,72,153,0.22),transparent_78%)] blur-[95px]" />
        </motion.div>
      </motion.div>
    </div>
  );
}