# Real Estate CRM

Kompletny system zarządzania nieruchomościami (CRM) dla biur nieruchomości. Aplikacja umożliwia zarządzanie ofertami nieruchomości, użytkownikami, sesjami oraz panel administracyjny.

## Funkcje

### Dla Agentów Nieruchomości
- Zarządzanie ofertami nieruchomości (mieszkania, domy, działki, lokale komercyjne)
- Dodawanie zdjęć i opisów nieruchomości
- Integracja z mapami i geoportalem
- Promocje nieruchomości

### Dla Administratorów
- Panel administracyjny do zarządzania użytkownikami
- Zarządzanie rolami (root, admin, agent)
- Monitorowanie sesji użytkowników
- Zarządzanie blokadami nieruchomości i użytkowników

### Dla Klientów
- Przeglądanie ofert nieruchomości
- Filtrowanie i wyszukiwanie
- Kontakt z agentami
- Mapa lokalizacji

## Technologie

- **Backend**: Node.js, Express.js, MongoDB, Redis
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Admin Panel**: React, TypeScript, Vite
- **Baza danych**: MongoDB
- **Cache**: Redis
- **Konteneryzacja**: Docker, Docker Compose
- **Autoryzacja**: JWT, Passport.js
- **Upload plików**: Cloudinary
- **Bezpieczeństwo**: Helmet, Rate Limiting, CSRF protection

## Wymagania

- Node.js >= 18.0.0
- Docker i Docker Compose
- MongoDB (lub Docker)
- Redis (lub Docker)

## Instalacja

1. Sklonuj repozytorium:
```bash
git clone https://github.com/your-username/real-estate-crm.git
cd real-estate-crm
```

2. Zainstaluj zależności:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ../crm-admin && npm install
```

3. Skopiuj plik konfiguracyjny środowiska:
```bash
cp .env.example .env
```

4. Wypełnij zmienne środowiskowe w `.env` (szczegóły w sekcji Konfiguracja)

## Uruchomienie

### Z Docker Compose (zalecane)
```bash
docker-compose up --build
```

Aplikacja będzie dostępna na:
- Frontend: http://localhost:5000
- Admin Panel: http://localhost:3000
- Backend API: http://localhost:8000

### Lokalnie (bez Docker)
1. Uruchom MongoDB i Redis lokalnie lub przez Docker
2. Wypełnij `.env` zgodnie z konfiguracją
3. Uruchom backend:
```bash
cd backend
npm run dev
```
4. Uruchom frontend:
```bash
cd frontend
npm run dev
```
5. Uruchom admin panel:
```bash
cd crm-admin
npm run dev
```

## Konfiguracja

Utwórz plik `.env` w katalogu głównym na podstawie `.env.example`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/real_estate_crm
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Cloudinary (dla uploadu zdjęć)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Session
SESSION_SECRET=your-session-secret

# Ports
BACKEND_PORT=8000
FRONTEND_PORT=5000
ADMIN_PORT=3000
```

## Struktura projektu

```
real-estate-crm/
├── backend/                 # API serwera
│   ├── config/             # Konfiguracja bazy danych
│   ├── controllers/        # Kontrolery API
│   ├── middleware/         # Middleware (auth, security, etc.)
│   ├── models/             # Modele MongoDB
│   ├── routes/             # Trasy API
│   ├── services/           # Logika biznesowa
│   ├── utils/              # Narzędzia pomocnicze
│   └── scripts/            # Skrypty (seed, migracje)
├── frontend/               # Aplikacja kliencka
│   ├── src/
│   │   ├── components/     # Komponenty React
│   │   ├── lib/           # Biblioteki pomocnicze
│   │   ├── pages/         # Strony
│   │   └── types/         # Typy TypeScript
├── crm-admin/              # Panel administracyjny
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── contexts/
├── mongodb-init/           # Inicjalizacja MongoDB
├── docker-compose.yml      # Konfiguracja Docker
└── docker-compose.prod.yml # Produkcyjna konfiguracja Docker
```

## Seed danych

Aby wypełnić bazę przykładowymi danymi:

```bash
cd backend
npm run seed
```

Domyślne konta:
- **Root Admin**: root@biuro.pl / Adm1n_R34lEst4t3_2025_Ultra
- **Admin**: admin@biuro.pl / Adm1n_R34lEst4t3_2025_Ultra
- **Agent**: agent@biuro.pl / Ag3nt_R34lEst4t3_2025_Ultra

## API Dokumentacja

Backend API jest dostępne pod `/api`. Szczegółowa dokumentacja zostanie dodana wkrótce.

## Bezpieczeństwo

- Rate limiting dla API
- CSRF protection
- Helmet dla security headers
- Input validation i sanitization
- JWT autoryzacja
- Session management z Redis

## Licencja

MIT License - zobacz [LICENSE](LICENSE) plik dla szczegółów.

## Współtworzenie

Pull requesty są mile widziane! Proszę przeczytać [CONTRIBUTING.md](CONTRIBUTING.md) przed rozpoczęciem pracy.

## Kontakt

Dla pytań lub wsparcia, otwórz issue na GitHub.