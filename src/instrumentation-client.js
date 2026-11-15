import { demoFrame } from "@/lib/demo/frame";
import { installSandbox } from "@/lib/demo/sandbox";

const frame = demoFrame();
if (frame) installSandbox(frame);
