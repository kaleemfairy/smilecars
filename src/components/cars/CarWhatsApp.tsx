import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";

/** Small WhatsApp button that opens a chat already mentioning this car (as on the old site's car cards). */
export function CarWhatsApp({ waNumber, carName, extra = "" }: { waNumber: string; carName: string; extra?: string }) {
  const digits = waNumber.replace(/\D/g, "");
  if (!digits) return null;
  const text = encodeURIComponent(`Hi Smile Cars, I'm interested in the ${carName}${extra ? ` ${extra}` : ""}.`);
  return (
    <a
      href={`https://wa.me/${digits}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Ask about the ${carName} on WhatsApp`}
      className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-whatsapp text-white hover:bg-whatsapp-dark"
    >
      <WhatsAppIcon className="size-5" />
    </a>
  );
}
