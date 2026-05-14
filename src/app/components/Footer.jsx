import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between gap-8 sm:gap-12 mb-12">
          <div className="max-w-xs sm:max-w-sm lg:max-w-xs">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <img src="/semplycode.png" alt="Semplycode" className="w-6 h-6 rounded" />
              <span className="text-lg font-bold tracking-tight text-primary">
                semplycode
              </span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              Permettiamo agli sviluppatori di capire il codice e risolvere gli errori con
              intelligenza e semplicità.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-12">
            <div>
              <h4 className="font-bold mb-4 sm:mb-6 text-xs uppercase tracking-wider text-gray-700">
                Prodotto
              </h4>
              <ul className="space-y-3 sm:space-y-4 text-sm text-gray-500">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Funzionalità
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Prezzi
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Integrazioni
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 sm:mb-6 text-xs uppercase tracking-wider text-gray-700">
                Azienda
              </h4>
              <ul className="space-y-3 sm:space-y-4 text-sm text-gray-500">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Chi Siamo
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Lavora con Noi
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 sm:mb-6 text-xs uppercase tracking-wider text-gray-700">
                Legale
              </h4>
              <ul className="space-y-3 sm:space-y-4 text-sm text-gray-500">
                <li>
                  <a href="/privacy" className="hover:text-primary transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="/terms" className="hover:text-primary transition-colors">
                    Termini
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-xs sm:text-sm text-center sm:text-left">
            © 2026 Semplycode. Tutti i diritti riservati.
          </p>
          <div className="flex gap-6">
            <a
              href="#"
              className="text-gray-400 hover:text-primary transition-colors text-sm"
            >
              Twitter
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-primary transition-colors text-sm"
            >
              GitHub
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-primary transition-colors text-sm"
            >
              Discord
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
