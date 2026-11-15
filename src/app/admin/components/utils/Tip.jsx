import { Tooltip } from "@skylab-kulubu/skylcn-ui";

// The wrapper stays the trigger, as it was the hover box before, so children need not take a ref
export default function Tip({ label, children }) {
    return (
        <Tooltip label={label}>
            <div className="relative flex">{children}</div>
        </Tooltip>
    );
}
