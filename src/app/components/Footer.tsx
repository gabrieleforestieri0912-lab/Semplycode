import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Github, Twitter, MessageCircle } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="py-12 sm:py-16 md:py-20 3xl:py-28 bg-[#080d14] border-t border-white/10">
      <div className="container mx-auto max-w-7xl 2xl:max-w-screen-2xl 3xl:max-w-[1720px] 4xl:max-w-[1920px]">
        <div className="flex flex-col lg:flex-row justify-between gap-12 lg:gap-20 3xl:gap-28 mb-16">
          {/* Brand */}
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-lg blur-lg opacity-0 hover:opacity-100 transition-opacity duration-300" />
                <Image
                  src="/semplycode.png"
                  alt="Semplycode"
                  width={32}
                  height={32}
                  className="rounded-lg relative z-[1]"
                />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                semplycode
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-[280px]">
              Il tuo compagno AI per analizzare, debuggare e ottimizzare il codice con
              intelligenza e semplicità.
            </p>
          </div>

          {/* Columns */}
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 gap-x-6 sm:gap-x-12 3xl:gap-x-20 gap-y-8 sm:gap-y-12 lg:gap-x-16">
            {/* Prodotto */}
            <div>
              <h4 className="font-semibold mb-4 text-xs uppercase tracking-[1.5px] text-emerald-400 flex items-center gap-2">
                Prodotto
                <span className="h-px w-4 bg-emerald-400/60" />
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/#funzionalita" className="text-slate-400 hover:text-emerald-400 hover:underline transition-all duration-200 hover:translate-x-0.5 inline-block">
                    Funzionalità
                  </Link>
                </li>
                <li>
                  <Link href="/#prezzi" className="text-slate-400 hover:text-emerald-400 hover:underline transition-all duration-200 hover:translate-x-0.5 inline-block">
                    Prezzi
                  </Link>
                </li>
                <li>
                  <Link href="/#estensione" className="text-slate-400 hover:text-emerald-400 hover:underline transition-all duration-200 hover:translate-x-0.5 inline-block">
                    Estensione Chrome
                  </Link>
                </li>
              </ul>
            </div>

            {/* Supporto */}
            <div>
              <h4 className="font-semibold mb-4 text-xs uppercase tracking-[1.5px] text-emerald-400 flex items-center gap-2">
                Supporto
                <span className="h-px w-4 bg-emerald-400/60" />
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/feedback" className="text-slate-400 hover:text-emerald-400 hover:underline transition-all duration-200 hover:translate-x-0.5 inline-block">
                    Invia Feedback
                  </Link>
                </li>
                <li>
                  <Link href="/#come-funziona" className="text-slate-400 hover:text-emerald-400 hover:underline transition-all duration-200 hover:translate-x-0.5 inline-block">
                    Come Funziona
                  </Link>
                </li>
                <li>
                  <Link href="/#demo" className="text-slate-400 hover:text-emerald-400 hover:underline transition-all duration-200 hover:translate-x-0.5 inline-block">
                    Demo Live
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legale */}
            <div>
              <h4 className="font-semibold mb-4 text-xs uppercase tracking-[1.5px] text-emerald-400 flex items-center gap-2">
                Legale
                <span className="h-px w-4 bg-emerald-400/60" />
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/privacy" className="text-slate-400 hover:text-emerald-400 hover:underline transition-all duration-200 hover:translate-x-0.5 inline-block">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-slate-400 hover:text-emerald-400 hover:underline transition-all duration-200 hover:translate-x-0.5 inline-block">
                    Termini di Servizio
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm">
          <p className="text-slate-400 text-xs sm:text-sm text-center sm:text-left">
            © {new Date().getFullYear()} Semplycode. Tutti i diritti riservati.
          </p>

          <div className="flex items-center gap-6">
            <Link
              href="#"
              className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 transition-all duration-200 group"
              aria-label="Twitter"
            >
              <Twitter className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-xs tracking-wide hidden sm:inline">X</span>
            </Link>
            <a
              href="https://github.com/gabrieleforestieri0912-lab"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 transition-all duration-200 group"
              aria-label="GitHub"
            >
              <Github className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-xs tracking-wide hidden sm:inline">GitHub</span>
            </a>
            <Link
              href="#"
              className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 transition-all duration-200 group"
              aria-label="Discord"
            >
              <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-xs tracking-wide hidden sm:inline">Discord</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
