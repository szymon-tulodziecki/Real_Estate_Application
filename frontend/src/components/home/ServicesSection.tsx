import { Card, CardContent } from '../ui/card';

export const ServicesSection = () => {
  const services = [
    {
      title: 'Sprzedaż',
      description: 'Profesjonalna sprzedaż Twojej nieruchomości',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      title: 'Kupno',
      description: 'Pomożemy znaleźć wymarzoną nieruchomość',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    {
      title: 'Wynajem',
      description: 'Zarządzanie najmem i wynajmem',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      title: 'Wycena',
      description: 'Bezpłatna wycena wartości nieruchomości',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    }
  ];

  return (
    <section className="py-12 md:py-16 bg-slate-50">
      <div className="container mx-auto px-4 md:px-8 lg:px-12">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl font-bold mb-3 md:mb-4">Nasze usługi</h2>
          <p className="text-lg text-slate-700">
            Kompleksowa obsługa na każdym etapie
          </p>
        </div>
        
        {/* ZMIANA: grid-cols-2 na mobile (2 kafelki obok siebie), gap-3 dla oszczędności miejsca */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {services.map((service, index) => (
            <Card key={index} className="text-center p-4 md:p-6 hover:shadow-lg transition-shadow bg-white border-0 shadow-md flex flex-col items-center justify-center h-full">
              <CardContent className="p-0 flex flex-col items-center">
                <div className="text-red-600 mb-3 md:mb-4 flex justify-center">
                  {service.icon}
                </div>
                <h3 className="text-base md:text-xl font-semibold mb-2">{service.title}</h3>
                <p className="text-xs md:text-base text-slate-700 leading-snug">
                  {service.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};