'use client';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Navbar />

      <main className="container mx-auto px-6 md:px-12 py-24 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

        <div className="prose prose-lg max-w-none text-gray-600">
          <p className="text-sm text-gray-500 mb-8">Ultimo aggiornamento: 16 Aprile 2026</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Introduzione</h2>
          <p>
            Semplycode (&quot;noi&quot;, &quot;nostro&quot;) si impegna a proteggere la vostra privacy. Questa Privacy Policy spiega come raccogliamo, usiamo, comunichiamo e proteggiamo le vostre informazioni.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Dati che raccogliamo</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Informazioni dell&apos;account:</strong> email, nome quando ti registri</li>
            <li><strong>Codice che analizzi:</strong> Il codice che incolli nell&apos;editor per l&apos;analisi</li>
            <li><strong>Dati di utilizzo:</strong> Statistiche anonime sull&apos;uso del servizio</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Come usiamo i dati</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Fornirti il servizio di analisi codice</li>
            <li>Migliorare i nostri servizi</li>
            <li>Supporto tecnico</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Il tuo codice è al sicuro</h2>
          <p>
            <strong>Non memorizziamo il tuo codice.</strong> Il codice che invii per l&apos;analisi viene processato in tempo reale e cancellato immediatamente dopo. Non viene salvato su nessun database.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Cookie</h2>
          <p>
            Utilizziamo solo cookie essenziali per il funzionamento del servizio. Nessun tracciamento pubblicitario.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Condivisione dati</h2>
          <p>
            <strong>Non vendiamo i tuoi dati.</strong> Non condividiamo le tue informazioni personali con terze parti per scopi di marketing.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. I tuoi diritti</h2>
          <p>
            Hai diritto di: accedere ai tuoi dati, correggerli, cancellarli. Contattaci a info@semplycode.it per qualsiasi richiesta.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Contatti</h2>
          <p>
            Per domande sulla privacy: <strong>info@semplycode.it</strong>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
