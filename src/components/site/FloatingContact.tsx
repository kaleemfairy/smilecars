import { Phone } from "lucide-react";
import { phoneDigits } from "@/lib/format";
import type { Settings } from "@/lib/types";
import { WhatsAppIcon } from "./WhatsAppIcon";

/** Click-to-chat WhatsApp and call buttons, fixed bottom-right on every public page. */
export function FloatingContact({ settings }: { settings: Settings }) {
  const wa = phoneDigits(settings.whatsappNumber);
  const phone = settings.phones[0];
  const text = encodeURIComponent("Hi Smile Cars, I'd like to book a self drive car.");
  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-3 print:hidden">
      {wa && (
        <a
          href={`https://wa.me/${wa}?text=${text}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp"
          className="flex size-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg hover:bg-whatsapp-dark"
        >
          <WhatsAppIcon className="size-7" />
        </a>
      )}
      {phone && (
        <a
          href={`tel:+${phoneDigits(phone)}`}
          aria-label={`Call us on ${phone}`}
          className="flex size-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700"
        >
          <Phone className="size-6" aria-hidden />
        </a>
      )}
    </div>
  );
}
