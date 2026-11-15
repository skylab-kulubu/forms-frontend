import { Avatar as SkylcnAvatar } from "@skylab-kulubu/skylcn-ui";

export default function Avatar({ name, email, photoUrl, size = "md", className = "" }) {
  return <SkylcnAvatar name={name} email={email} src={photoUrl} size={size} className={className} />;
}
