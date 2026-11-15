import { StateCard as SkylcnStateCard } from "@skylab-kulubu/skylcn-ui";

export default function StateCard({ title, description, Icon, isLoading, tone = "neutral", meta, children }) {
    return (
        <SkylcnStateCard title={title} description={description} icon={Icon} loading={isLoading} tone={tone} meta={meta}>
            {children}
        </SkylcnStateCard>
    );
}
