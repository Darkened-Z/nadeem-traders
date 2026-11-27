export type StoreSettings = {
  whatsapp_number: string;
  announcement_text: string;
  delivery_fee: string;
  free_delivery_threshold: string;
  store_phone: string;
  store_email: string;
  store_address: string;
};

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  whatsapp_number: "923000000000",
  announcement_text:
    "100% Purity Guaranteed · Apka Trusted Stop · Fast Doorstep Delivery via PostEx Courier",
  delivery_fee: "250",
  free_delivery_threshold: "3000",
  store_phone: "+92 300 0000000",
  store_email: "info@nadeemtraders.pk",
  store_address: "Gala Mandi, Pakistan",
};

export function sanitizeWhatsappNumber(raw?: string | null): string {
  const digits = (raw ?? "").replace(/[^\d]/g, "");
  return digits || DEFAULT_STORE_SETTINGS.whatsapp_number;
}
