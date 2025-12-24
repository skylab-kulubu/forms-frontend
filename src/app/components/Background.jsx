import { motion } from 'framer-motion';

export default function Background() {
  return (
    <div className="fixed inset-0 z-0 w-full h-full overflow-hidden flex items-center justify-center">
      <motion.div  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 2, ease: "easeInOut" }} className="relative w-full h-full">        
        <motion.div
          className="absolute -top-[10%] -left-[20%] w-[70vw] h-[70vw] min-w-[600px] min-h-[600px] bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.2),transparent_80%)] rounded-full mix-blend-screen filter blur-[100px]"
          animate={{  x: [0, 50, -30, 0], y: [0, -50, 30, 0], scale: [1, 1.1, 0.95, 1] }}
          transition={{ duration: 18, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-[20%] -right-[10%] w-[80vw] h-[80vw] min-w-[700px] min-h-[700px] bg-[radial-gradient(ellipse_at_bottom_right,rgba(236,72,153,0.2),transparent_80%)] rounded-full mix-blend-screen filter blur-[130px]"
          animate={{ x: [0, -60, 40, 0], y: [0, 60, -40, 0], scale: [1, 0.9, 1.1, 1] }}
          transition={{ duration: 22, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        />
      </motion.div>
    </div>
  );
};