// URL dello store dell'estensione — placeholder finché non pubblicata.
// UI gestisce già lo stato "In arrivo" senza link cliccabile (ExtensionSection).
// Sostituire con URL reale con ID a 32 char quando la listing sarà pubblicata.
export const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/semplycode-ai-co-pilot";

// Stile condiviso dei bottoni "Aggiungi a Chrome" (Hero + sezione estensione):
// mantiene i due bottoni identici in ogni punto del sito.
export const CHROME_BUTTON_CLASS =
  "w-full sm:w-72 inline-flex items-center justify-center gap-3 px-8 md:px-10 py-4 rounded-full text-base font-bold text-white transition-all duration-200 hover:scale-[1.04] hover:brightness-110 active:scale-95";

export const CHROME_BUTTON_STYLE = {
  background: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
  boxShadow: "0 0 40px rgba(16,185,129,0.3), 0 8px 24px rgba(0,0,0,0.25)",
};
