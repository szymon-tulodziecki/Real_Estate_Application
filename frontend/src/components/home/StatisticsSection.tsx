interface Stats {
  uniqueCities: number;
  minSalePrice: number;
  minRentPrice: number;
  satisfactionRate: number;
}

interface StatisticsSectionProps {
  stats: Stats;
}

export const StatisticsSection = ({ stats }: StatisticsSectionProps) => {
  return (
    <section className="py-6 md:py-8 bg-slate-50">
      <div className="container mx-auto px-6 md:px-8 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 max-w-6xl mx-auto">
          
          {/* Cities Stat */}
          <div className="text-center p-2 md:p-4 flex flex-col">
            <div className="w-10 h-10 md:w-16 md:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
              <svg className="w-5 h-5 md:w-8 md:h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
            </div>
            <div className="text-2xl md:text-4xl font-bold text-slate-700 mb-1 md:mb-2">
              {stats.uniqueCities > 0 ? stats.uniqueCities : 'Cała Polska'}
            </div>
            <div className="text-xs md:text-sm text-slate-700 font-medium mt-auto">
              {stats.uniqueCities > 0 ? 'Działamy w miastach' : 'Działamy lokalnie i regionalnie'}
            </div>
          </div>

          {/* Sale Price Stat */}
          <div className="text-center p-2 md:p-4 flex flex-col">
            <div className="w-10 h-10 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
              <svg className="w-5 h-5 md:w-8 md:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="text-lg md:text-3xl font-bold text-slate-700 mb-1 md:mb-2">
              {stats.minSalePrice > 0 ? `${stats.minSalePrice.toLocaleString('pl-PL')} PLN` : 'Najlepsze ceny'}
            </div>
            <div className="text-xs md:text-sm text-slate-700 font-medium mt-auto">
              {stats.minSalePrice > 0 ? 'Zakup już od' : 'Konkurencyjne oferty sprzedaży'}
            </div>
          </div>

          {/* Rent Price Stat */}
          <div className="text-center p-2 md:p-4 flex flex-col">
            <div className="w-10 h-10 md:w-16 md:h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
              <svg className="w-5 h-5 md:w-8 md:h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div className="text-lg md:text-3xl font-bold text-slate-700 mb-1 md:mb-2">
              {stats.minRentPrice > 0 ? `${stats.minRentPrice.toLocaleString('pl-PL')} PLN` : 'Atrakcyjne stawki'}
            </div>
            <div className="text-xs md:text-sm text-slate-700 font-medium mt-auto">
              {stats.minRentPrice > 0 ? 'Najem od / miesięcznie' : 'Elastyczne warunki najmu'}
            </div>
          </div>

          {/* Satisfaction Stat */}
          <div className="text-center p-2 md:p-4 flex flex-col">
            <div className="w-10 h-10 md:w-16 md:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
              <svg className="w-5 h-5 md:w-8 md:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-2xl md:text-4xl font-bold text-slate-700 mb-1 md:mb-2">{stats.satisfactionRate}%</div>
            <div className="text-xs md:text-sm text-slate-700 font-medium mt-auto">Zadowolonych klientów</div>
          </div>
          
        </div>
      </div>
    </section>
  );
};
