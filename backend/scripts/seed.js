const mongoose = require('mongoose');
const User = require('../models/User');
const Property = require('../models/Property');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/database');

const seedData = async () => {
  try {
    console.log('Starting database seeding...');
    
    await connectDB();
    console.log('Dropping entire database...');
    await mongoose.connection.db.dropDatabase();

    
    console.log('Cleaning existing data...');
    await User.deleteMany({});
    await Property.deleteMany({});
    
    console.log('Creating users...');
    
    // ROOT ADMIN (Super Admin)
    const rootAdmin = await User.create({
      employeeId: '1001',
      email: 'root@biuro.pl',
      password: process.env.SEED_ROOT_PASSWORD || 'Adm1n_R34lEst4t3_2025_Ultra',
      firstName: 'Root',
      lastName: 'Administrator',
      phone: '+48 123 456 789',
      role: 'root',
      createdBy: null
    });

    const admin = await User.create({
      employeeId: '1002',
      email: 'admin@biuro.pl',
      password: process.env.SEED_ADMIN_PASSWORD || 'Adm1n_R34lEst4t3_2025_Ultra',
      firstName: 'Tomasz',
      lastName: 'Zarządzający',
      phone: '+48 111 222 333',
      role: 'admin',
      createdBy: rootAdmin._id
    });
    
    const agent = await User.create({
      employeeId: '2001',
      email: 'agent@biuro.pl',
      password: process.env.SEED_AGENT_PASSWORD || 'Ag3nt_R34lEst4t3_2025_Ultra',
      firstName: 'Jan',
      lastName: 'Kowalski',
      phone: '+48 987 654 321',
      role: 'agent',
      isActive: true,
      bio: 'Doświadczony agent specjalizujący się w nieruchomościach mieszkaniowych. Ponad 8 lat doświadczenia w branży nieruchomości.',
      specializations: ['apartment', 'house'],
      experienceYears: 8,
      isPublic: true,
      createdBy: rootAdmin._id
    });

    console.log('Creating properties...');
    
    const sampleProperties = [
      // MIESZKANIA AKTYWNE
      {
        title: 'Luksusowe mieszkanie w centrum Warszawy',
        description: 'Oferujemy do sprzedaży wyjątkowe mieszkanie o powierzchni 85m² położone w prestiżowej dzielnicy Śródmieście. Nieruchomość została wyremontowana w 2023 roku z użyciem najwyższej jakości materiałów. Mieszkanie składa się z przestronnego salonu z aneksem kuchennym, dwóch sypialni, łazienki z wanną i prysznicem oraz balkonu z widokiem na miasto. W cenie garaż podziemny i komórka lokatorska.',
        price: 1450000,
        type: 'mieszkanie',
        transactionType: 'sprzedaż',
        area: 85,
        rooms: 3,
        location: {
          address: 'ul. Marszałkowska 150',
          city: 'Warszawa',
          postalCode: '00-061'
        },
        features: ['balkon', 'garaż', 'winda', 'piwnica', 'klimatyzacja'],
        agent: agent._id,
        createdBy: rootAdmin._id,
        status: 'aktywne',
        isPromoted: true,
        promotionalPrice: 1350000,
        images: []
      },
      {
        title: 'Nowoczesne mieszkanie 2-pokojowe - Mokotów',
        description: 'Mieszkanie po generalnym remoncie w nowoczesnym stylu. Wysoki standard wykończenia, podłogi drewnopodobne, kuchnia w zabudowie ze sprzętem AGD. Doskonała lokalizacja z dostępem do komunikacji publicznej.',
        price: 890000,
        type: 'mieszkanie',
        transactionType: 'sprzedaż',
        area: 56,
        rooms: 2,
        location: {
          address: 'ul. Dolna 45',
          city: 'Warszawa',
          postalCode: '02-516'
        },
        features: ['balkon', 'winda', 'parking'],
        agent: agent._id,
        createdBy: agent._id,
        status: 'aktywne',
        images: []
      },
      {
        title: 'Przestronne 4-pokojowe mieszkanie - Żoliborz',
        description: 'Mieszkanie w kamienicy z 1956 roku po kompleksowym remoncie. Unikalne detale architektoniczne zostały zachowane i wyeksponowane. Mieszkanie posiada wysokie sufity (3.2m) i duże okna.',
        price: 1250000,
        type: 'mieszkanie',
        transactionType: 'sprzedaż',
        area: 92,
        rooms: 4,
        location: {
          address: 'ul. Krasińskiego 12',
          city: 'Warszawa',
          postalCode: '01-755'
        },
        features: ['parking', 'strych', 'piwnica'],
        agent: agent._id,
        createdBy: agent._id,
        status: 'aktywne',
        images: []
      },

      // DOMY AKTYWNE
      {
        title: 'Nowoczesny dom z ogrodem - Kraków',
        description: 'Piękny dom jednorodzinny w spokojnej okolicy Krakowa. Nieruchomość została wybudowana w 2020 roku według najnowszych standardów energooszczędności. Dom składa się z parteru i piętra. Na parterze znajduje się przestronny salon z kominkiem, kuchnia, jadalnia, gabinet i łazienka. Na piętrze 3 sypialnie i łazienka. Działka o powierzchni 800m² z pięknym ogrodem.',
        price: 1850000,
        type: 'dom',
        transactionType: 'sprzedaż',
        area: 180,
        rooms: 5,
        location: {
          address: 'ul. Słoneczna 12',
          city: 'Kraków',
          postalCode: '31-425'
        },
        features: ['ogród', 'garaż', 'kominek', 'klimatyzacja', 'ochrona'],
        agent: agent._id,
        createdBy: agent._id,
        status: 'aktywne',
        images: []
      },
      {
        title: 'Tradycyjny dom w Podkowie Leśnej',
        description: 'Urokliwy dom w stylu dworkowym z 1965 roku, gruntownie odnowiony z zachowaniem oryginalnego charakteru. Piękna działka z dojrzałym drzewostanem. Idealne miejsce dla osób ceniących spokój i kontakt z naturą.',
        price: 2200000,
        type: 'dom',
        transactionType: 'sprzedaż',
        area: 220,
        rooms: 6,
        location: {
          address: 'ul. Parkowa 8',
          city: 'Podkowa Leśna',
          postalCode: '05-807'
        },
        features: ['ogród', 'garaż', 'kominek', 'taras', 'ochrona'],
        agent: agent._id,
        createdBy: agent._id,
        status: 'aktywne',
        isPromoted: true,
        images: []
      },

      // DZIAŁKI AKTYWNE
      {
        title: 'Działka inwestycyjna pod Warszawą',
        description: 'Atrakcyjna działka inwestycyjna z potencjałem zabudowy mieszkaniowej. Położona w spokojnej okolicy z dobrym dojazdem do centrum Warszawy. Media dostępne w granicy działki. Plan zagospodarowania pozwala na budowę domu jednorodzinnego.',
        price: 680000,
        type: 'działka',
        transactionType: 'sprzedaż',
        area: 1500,
        location: {
          address: 'ul. Leśna 8',
          city: 'Pruszków',
          postalCode: '05-800'
        },
        features: ['internet', 'parking', 'ogród'],
        agent: agent._id,
        createdBy: agent._id,
        status: 'aktywne',
        images: []
      },

      // NIERUCHOMOŚCI KOMERCYJNE
      {
        title: 'Lokal handlowo-usługowy - Centrum Warszawy',
        description: 'Doskonale położony lokal na parterze kamienicy przy głównej ulicy handlowej. Idealne miejsce dla działalności gastronomicznej, usługowej lub handlowej. Wysokie przeszklenie, dobra widoczność z ulicy.',
        price: 1200000,
        type: 'komercyjne',
        transactionType: 'sprzedaż',
        area: 85,
        location: {
          address: 'ul. Nowy Świat 45',
          city: 'Warszawa',
          postalCode: '00-042'
        },
        features: ['internet', 'klimatyzacja', 'parking'],
        agent: agent._id,
        createdBy: agent._id,
        status: 'aktywne',
        images: []
      },

      // NIERUCHOMOŚCI W HISZPANII
      {
        title: 'Luksusowe mieszkanie z widokiem na morze - Barcelona',
        description: 'Piękne mieszkanie w nowoczesnym budynku z widokiem na Morze Śródziemne. Pełne słońca, z tarasem o powierzchni 40m². Idealne dla osób szukających włoskiego stylu życia. Kompleks z basenem, siłownią i obsługą concierge.',
        price: 850000,
        type: 'mieszkanie',
        transactionType: 'sprzedaż',
        area: 95,
        rooms: 3,
        location: {
          address: 'Paseo Marítimo 25',
          city: 'Barcelona',
          country: 'Hiszpania',
          postalCode: '08-039'
        },
        features: ['balkon', 'taras', 'parking', 'klimatyzacja', 'basen'],
        agent: agent._id,
        createdBy: agent._id,
        status: 'aktywne',
        isPromoted: true,
        images: []
      },
      {
        title: 'Przyciulne mieszkanie w starym mieście - Valencia',
        description: 'Zabytkowe mieszkanie w sercu starego miasta Valencia. Zachowało autentyczny charakter z nowoczesnymi udogodnieniami. Blisko plaży i wszystkich atrakcji turystycznych. Idealne dla inwestycji rental.',
        price: 420000,
        type: 'mieszkanie',
        transactionType: 'sprzedaż',
        area: 65,
        rooms: 2,
        location: {
          address: 'Calle de la Paz 18',
          city: 'Valencia',
          country: 'Hiszpania',
          postalCode: '46-008'
        },
        features: ['klimatyzacja', 'parking', 'kuchnia modernizowana'],
        agent: agent._id,
        createdBy: agent._id,
        status: 'aktywne',
        images: []
      },
      {
        title: 'Nowoczesny dom z basenem - Costa Brava',
        description: 'Spektakularny dom w jednej z najpiękniejszych części Costa Bravy. Pełna prywatność, duży basen, taras z widokami na morze. Zaledwie 15 minut jazdy do plaży Tossa de Mar.',
        price: 2100000,
        type: 'dom',
        transactionType: 'sprzedaż',
        area: 240,
        rooms: 5,
        location: {
          address: 'Camino del Mar 55',
          city: 'Tossa de Mar',
          country: 'Hiszpania',
          postalCode: '17-320'
        },
        features: ['basen', 'taras', 'ogród', 'garaż', 'klimatyzacja', 'widok morski'],
        agent: agent._id,
        createdBy: agent._id,
        status: 'aktywne',
        images: []
      },
      {
        title: 'Słoneczna działka na Majorce',
        description: 'Fantastyczna działka budowlana na Majorce z pięknym widokiem na góry. Idealna lokalizacja dla willi marzeń. Media już dostępne. Plan urbanizacyjny już zatwierddzony.',
        price: 680000,
        type: 'działka',
        transactionType: 'sprzedaż',
        area: 2000,
        location: {
          address: 'Finca Rural s/n',
          city: 'Pollença',
          country: 'Hiszpania',
          postalCode: '07-460'
        },
        features: ['internet', 'panorama'],
        agent: agent._id,
        createdBy: agent._id,
        status: 'aktywne',
        images: []
      },
      {
        title: 'Prestiżowy lokal komercyjny - Madryt',
        description: 'Lokal w najlepszej dzielnicy biznesowej Madrytu. Idealne miejsce dla biura, restauracji lub butiku. Duże przeszklenie, nowoczesne wykończenie, doskonała widoczność.',
        price: 1500000,
        type: 'komercyjne',
        transactionType: 'sprzedaż',
        area: 120,
        location: {
          address: 'Avenida de la Paz 50',
          city: 'Madryt',
          country: 'Hiszpania',
          postalCode: '28-002'
        },
        features: ['klimatyzacja', 'internet', 'parking', 'ascensor'],
        agent: agent._id,
        createdBy: agent._id,
        status: 'aktywne',
        images: []
      },

      // NIERUCHOMOŚCI SPRZEDANE
      {
        title: 'SPRZEDANE - Mieszkanie 3-pokojowe na Wilanowie',
        description: 'Sprzedane mieszkanie w nowoczesnym kompleksie mieszkaniowym. Transakcja zakończona pomyślnie w grudniu 2024.',
        price: 950000,
        type: 'mieszkanie',
        transactionType: 'sprzedaż',
        area: 68,
        rooms: 3,
        location: {
          address: 'ul. Klimczaka 15',
          city: 'Warszawa',
          postalCode: '02-797'
        },
        features: ['balkon', 'winda', 'parking'],
        agent: agent._id,
        createdBy: agent._id,
        status: 'sprzedane',
        images: []
      },
      {
        title: 'SPRZEDANY - Dom wolnostojący w Konstancinie',
        description: 'Piękny dom jednorodzinny sprzedany w listopadzie 2024. Transakcja przeprowadzona bez problemów.',
        price: 2800000,
        type: 'dom',
        transactionType: 'sprzedaż',
        area: 250,
        rooms: 7,
        location: {
          address: 'ul. Oliwska 22',
          city: 'Konstancin-Jeziorna',
          postalCode: '05-520'
        },
        features: ['ogród', 'garaż', 'taras', 'ochrona'],
        agent: agent._id,
        createdBy: agent._id,
        status: 'sprzedane',
        images: []
      },
      {
        title: 'SPRZEDANA - Działka budowlana w Józefowie',
        description: 'Działka budowlana w atrakcyjnej lokalizacji. Sprzedaż zakończona w październiku 2024.',
        price: 750000,
        type: 'działka',
        transactionType: 'sprzedaż',
        area: 1200,
        location: {
          address: 'ul. Sosnowa 5',
          city: 'Józefów',
          postalCode: '05-410'
        },
        features: ['internet', 'ogród', 'parking'],
        agent: agent._id,
        createdBy: agent._id,
        status: 'sprzedane',
        images: []
      },

      // MIESZKANIA DO WYNAJMU
      {
        title: 'Mieszkanie do wynajmu - 3 pokoje Śródmieście',
        description: 'Eleganckie mieszkanie do długoterminowego wynajmu w centrum Warszawy. Idealne dla ekspatów i specjalistów. Mieszkanie w pełni umeblowane i wyposażone.',
        price: 4500,
        type: 'mieszkanie',
        transactionType: 'wynajem',
        area: 75,
        rooms: 3,
        location: {
          address: 'ul. Krucza 30',
          city: 'Warszawa',
          postalCode: '00-526'
        },
        features: ['meble', 'klimatyzacja', 'balkon', 'winda'],
        agent: agent._id,
        createdBy: agent._id,
        status: 'aktywne',
        images: []
      },
      {
        title: 'Kawalerka do wynajmu - studencka Mokotów',
        description: 'Mała, ale funkcjonalna kawalerka idealna dla studenta lub singla. Blisko uczelni i komunikacji publicznej.',
        price: 2200,
        type: 'mieszkanie',
        transactionType: 'wynajem',
        area: 28,
        rooms: 1,
        location: {
          address: 'ul. Woronicza 12',
          city: 'Warszawa',
          postalCode: '02-625'
        },
        features: ['meble', 'internet', 'parking'],
        agent: agent._id,
        createdBy: agent._id,
        status: 'aktywne',
        images: []
      }
    ];

    await Property.create(sampleProperties);
    
    console.log('\n===== SEEDING COMPLETED =====');
    console.log('Created users:');
    console.log('   ROOT ADMIN: employeeId 1001 / login: root@biuro.pl / hasło:', process.env.SEED_ROOT_PASSWORD || 'Adm1n_R34lEst4t3_2025_Ultra', '(Root Administrator)');
    console.log('   ADMIN: employeeId 1002 / login: admin@biuro.pl / hasło:', process.env.SEED_ADMIN_PASSWORD || 'Adm1n_R34lEst4t3_2025_Ultra', '(Tomasz Zarządzający)');
    console.log('   AGENT: employeeId 2001 / login: agent@biuro.pl / hasło:', process.env.SEED_AGENT_PASSWORD || 'Ag3nt_R34lEst4t3_2025_Ultra', '(Jan Kowalski)');
    console.log('\nProperties created: ', sampleProperties.length);
    console.log('   - Mieszkania aktywne: 5');
    console.log('   - Domy aktywne: 3');
    console.log('   - Działki aktywne: 2');
    console.log('   - Komercyjne aktywne: 2');
    console.log('   - Sprzedane: 3');
    console.log('   - Do wynajmu: 2');
    console.log('   - Promocyjne: 2');
    console.log('   - W Hiszpanii: 5 (mieszkania, domy, działki, komercyjne)');
    console.log('================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
