import { Phone } from "lucide-react";
import { phoneDigits } from "@/lib/format";
import type { Settings } from "@/lib/types";
import { WhatsAppIcon } from "./WhatsAppIcon";

/** Call and click-to-chat WhatsApp buttons, fixed bottom-right on every public page. */
export function FloatingContact({ settings }: { settings: Settings }) {
  const wa = phoneDigits(settings.whatsappNumber);
  const phone = settings.phones[0];
  const text = encodeURIComponent("Hi Smile Cars, I'd like to book a self drive car.");
  return (
    <div className="fixed bottom-4 right-3 z-40 flex flex-col gap-2.5 sm:bottom-6 sm:right-6 print:hidden">
      {phone && (
        <a
          href={`tel:+${phoneDigits(phone)}`}
          aria-label={`Call us on ${phone}`}
          className="flex size-12 items-center justify-center rounded-full bg-brand-700 text-white shadow-float transition-transform hover:-translate-y-0.5 hover:bg-brand-800"
        >
          <Phone className="size-5" aria-hidden />
        </a>
      )}
      {wa && (
        <a
          href={`https://wa.me/${wa}?text=${text}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp"
          className="flex size-12 items-center justify-center rounded-full bg-whatsapp text-white shadow-float transition-transform hover:-translate-y-0.5 hover:bg-whatsapp-dark"
        >
          <WhatsAppIcon className="size-6" />
        </a>
      )}
    </div>
  );
}
