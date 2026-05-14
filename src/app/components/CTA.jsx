import React from 'react';

const CTA = () => {
  return (
    <section className="py-20 md:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="bg-gray-900 rounded-[3rem] p-8 sm:p-12 md:p-20 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 sm:mb-8">
              Pronto a scrivere codice con confidenza?
            </h2>
            <p className="text-gray-400 text-lg sm:text-xl mb-10 md:mb-12 max-w-2xl mx-auto px-2 sm:px-0">
              Unisciti a oltre 10.000 sviluppatori che costruiscono più velocemente e meglio
              con Semplycode.
            </p>
            <button className="bg-primary text-white px-8 sm:px-10 py-3.5 sm:py-5 rounded-full text-base sm:text-lg font-bold hover:bg-primary/90 transition-all shadow-2xl shadow-primary/40 active:scale-95">
              Inizia Gratis
            </button>
          </div>
          {/* Decorative background for CTA */}
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-primary/20 rounded-full blur-[80px] -mr-16 -mt-16 sm:-mr-32 sm:-mt-32"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-64 sm:h-64 bg-primary/10 rounded-full blur-[80px] -ml-16 -mb-16 sm:-ml-32 sm:-mb-32"></div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
