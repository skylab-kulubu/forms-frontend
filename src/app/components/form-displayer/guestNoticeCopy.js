import { CircleAlert, Hourglass, ShieldAlert } from "lucide-react";
import { scanResultCopy, waitCopy } from "@/lib/guest-uploads";

function fileNoticeAfter(status, scanResult) {
  if (status === "rejected" || status === "fileRejected") return ` dosya güvenlik taramasından geçmedi. ${scanResultCopy(scanResult)}`;
  if (status === "expired" || status === "fileExpired") return " dosyanın süresi doldu. Dosyayı yeniden yükleyin.";
  return " dosya bu soruya uymuyor. Başka bir dosya yükleyin.";
}

export function guestNoticeCopy(notice, questionNumbers, scriptBlocked) {
  switch (notice.kind === "verify" && scriptBlocked ? "blocked" : notice.kind) {
    case "verify":
      return { icon: ShieldAlert, tone: "text-red-300", login: true, text: "Güvenlik doğrulaması geçmedi. Tekrar gönderin ya da giriş yapın." };
    case "blocked":
      return { icon: ShieldAlert, tone: "text-amber-300", login: true, text: "Güvenlik doğrulaması yüklenemedi. Reklam engelleyiciyi bu sayfada kapatıp tekrar gönderin ya da giriş yapın." };
    case "file": {
      const number = questionNumbers.get(notice.questionId);
      const jump = number ? { id: notice.questionId, label: `${number}. sorudaki` } : null;
      const after = fileNoticeAfter(notice.status, notice.scanResult);
      return { icon: CircleAlert, tone: "text-red-300", jump, text: jump ? after : `Yüklediğiniz${after}` };
    }
    case "scanning":
      return { icon: Hourglass, tone: "text-amber-300", retry: true, text: "Dosyanız hâlâ taranıyor. Birkaç saniye sonra tekrar gönderin." };
    case "scanSlow":
      return { icon: Hourglass, tone: "text-amber-300", retry: true, text: "Dosyanızın taranması uzun sürüyor. Biraz bekleyip tekrar gönderin." };
    case "busy":
      return {
        icon: Hourglass, tone: "text-amber-300", retry: true,
        text: notice.seconds > 60 ? `Şu an çok yoğun. ${waitCopy(notice.seconds)} sonra tekrar gönderin.` : "Şu an çok yoğun. Birkaç saniye sonra tekrar gönderin.",
      };
    case "submitUnavailable":
      return { icon: CircleAlert, tone: "text-red-300", retry: true, text: "Şu an gönderilemiyor. Biraz sonra tekrar deneyin." };
    case "login":
      return { icon: CircleAlert, tone: "text-red-300", login: true, text: "Bu forma şu an giriş yapmadan dosya gönderilemiyor. Dosyayla göndermek için giriş yapın." };
    default:
      return { icon: CircleAlert, tone: "text-red-300", retry: true, text: "Dosyalar şu an kaydedilemiyor. Biraz sonra tekrar deneyin." };
  }
}
