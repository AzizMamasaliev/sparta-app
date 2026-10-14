// Thin wrapper over Telegram WebApp. Every call is safe outside Telegram (browser preview).
/* eslint-disable @typescript-eslint/no-explicit-any */
const W: any = (globalThis as any).Telegram?.WebApp;

export const inTelegram = !!W?.initData;
export const initData: string = W?.initData ?? "";
export const tgUser: { id: number; first_name?: string; language_code?: string; photo_url?: string } | null =
  W?.initDataUnsafe?.user ?? null;
export const startParam: string | undefined = W?.initDataUnsafe?.start_param;

export function tgReady() {
  if (!W) return;
  try {
    W.ready();
    W.expand();
    W.setHeaderColor?.("#0B0B0E");
    W.setBackgroundColor?.("#0B0B0E");
    W.setBottomBarColor?.("#0B0B0E");
    W.disableVerticalSwipes?.();
  } catch { /* old clients */ }
}

export const haptic = {
  tap: () => W?.HapticFeedback?.impactOccurred?.("light"),
  heavy: () => W?.HapticFeedback?.impactOccurred?.("heavy"),
  ok: () => W?.HapticFeedback?.notificationOccurred?.("success"),
  warn: () => W?.HapticFeedback?.notificationOccurred?.("warning"),
  select: () => W?.HapticFeedback?.selectionChanged?.(),
};

let backHandler: (() => void) | null = null;
export function setBack(handler: (() => void) | null) {
  if (!W?.BackButton) return;
  if (backHandler) W.BackButton.offClick(backHandler);
  backHandler = handler;
  if (handler) {
    W.BackButton.onClick(handler);
    W.BackButton.show();
  } else W.BackButton.hide();
}

export function openInvoice(link: string): Promise<"paid" | "cancelled" | "failed" | "pending"> {
  return new Promise((resolve) => {
    if (!W?.openInvoice) return resolve("failed");
    W.openInvoice(link, (status: any) => resolve(status));
  });
}

export function openTgLink(url: string) {
  if (W?.openTelegramLink) W.openTelegramLink(url);
  else window.open(url, "_blank");
}

export function shareText(url: string, text: string) {
  openTgLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
}

export function confirmClose(on: boolean) {
  try {
    if (on) W?.enableClosingConfirmation?.();
    else W?.disableClosingConfirmation?.();
  } catch { /* ignore */ }
}
