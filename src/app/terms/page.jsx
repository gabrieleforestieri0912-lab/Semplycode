'use client';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Terms() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Navbar />
      
      <main className="container mx-auto px-4 py-24 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Termini di Servizio</h1>
        
        <div className="prose prose-lg max-w-none text-gray-600">
          <p className="text-sm text-gray-500 mb-8">Ultimo aggiornamento: 16 Aprile 2026</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Accettazione dei termini</h2>
          <p>
            Usando Semplycode accetti questi termini. Se non accetti uno qualsiasi di questi termini, non usare il servizio.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Descrizione del servizio</h2>
          <p>
            Semplycode è un servizio di analisi codice basato su AI. Fornisce suggerimenti, spiegazioni e miglioramenti per il codice che inserisci. È uno strumento di supporto, non sostituisce il giudizio umano.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Uso consentito</h2>
          <p>Accetti di:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Non usare il servizio per attività illegali</li>
            <li>Non tentare di逆 Engineering del servizio</li>
            <li>Non usare il servizio per generare codice dannoso</li>
            <li>Non violare diritti di terzi</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Proprietà intellettuale</h2>
          <p>
            Il servizio Semplycode e il suo codice sono di proprietà di Semplycode. I diritti sul codice che generi restano tuoi. Accetti che possiamo usare statistiche anonime di utilizzo per migliorare il servizio.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Esclusione garanzie</h2>
          <p>
            <strong>Il servizio è fornito &quot;cosìcome è&quot;.</strong> Non garantiamo che il servizio sia sempre disponibile, privo di errori, o sicuro al 100%.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Limitazione di responsabilità</h2>
          <p>
            Semplycode non è responsabile per decisioni prese basandoti sulle nostre analisi. Sei tu il responsabile finale del codice che scrivi e distribuisci.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Abbonamenti e pagamenti</h2>
          <p>
            I piani a pagamento si rinnovano automaticamente mensilmente. Puoi cancellare in qualsiasi momento. Non rimborsiamo periodi parziali.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Modifiche al servizio</h2>
          <p>
            Possiamo modificare, sospendere o interrompere il servizio in qualsiasi momento. Per servizi gratuiti, non abbiamo obblighi di continuità.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Legge applicabile</h2>
          <p>
            Questi termini sono regolati dalla legge italiana. Per controversie, foro competente è Milano.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Contatti</h2>
          <p>
            Per domande sui termini: <strong>info@semplycode.it</strong>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}