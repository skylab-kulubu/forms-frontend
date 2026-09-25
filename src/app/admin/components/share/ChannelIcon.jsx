import { createElement } from "react";
import { Globe, Instagram, Link2, Linkedin, Mail, MessageCircle, QrCode, Tag } from "lucide-react";

const ICONS = {
  general: Link2,
  instagram: Instagram,
  whatsapp: MessageCircle,
  linkedin: Linkedin,
  email: Mail,
  website: Globe,
  qr: QrCode,
  other: Tag,
};

export default function ChannelIcon({ source, size = 13, className = "" }) {
  const icon = source ? ICONS[source] ?? Tag : Link2;
  return createElement(icon, { size, className });
}
