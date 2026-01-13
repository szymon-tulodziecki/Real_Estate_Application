# Współtworzenie (Contributing)

Dziękujemy za zainteresowanie współtworzeniem Real Estate CRM! Poniżej znajdziesz wytyczne jak przyczynić się do rozwoju projektu.

## Jak zacząć

1. **Fork** repozytorium na GitHub
2. **Sklonuj** swojego forka lokalnie
3. **Utwórz** branch dla swojej funkcji: `git checkout -b feature/nazwa-funkcji`
4. **Zainstaluj** zależności: `npm install` w katalogach backend, frontend, crm-admin
5. **Rozwijaj** swoją funkcję
6. **Testuj** lokalnie
7. **Commituj** zmiany: `git commit -m "Dodaj opis zmian"`
8. **Push** do swojego forka: `git push origin feature/nazwa-funkcji`
9. **Utwórz Pull Request** na GitHub

## Wytyczne dotyczące kodu

### Backend (Node.js/Express)
- Używaj ESLint do sprawdzania stylu kodu
- Dodawaj JSDoc dla funkcji publicznych
- Używaj async/await zamiast callbacków
- Waliduj input za pomocą express-validator
- Dodawaj testy jednostkowe dla nowych funkcji

### Frontend (React/TypeScript)
- Używaj TypeScript dla typów
- Śledź komponenty funkcyjne z hooks
- Używaj React Query dla API calls
- Dodawaj testy komponentów z React Testing Library

### Ogólne
- Commit messages po angielsku, opisowe
- Nie commituj wrażliwych danych (.env, klucze API)
- Używaj branch naming: `feature/`, `bugfix/`, `hotfix/`

## Zgłaszanie błędów

Używaj GitHub Issues do zgłaszania błędów. Włącz:
- Opis problemu
- Kroki do reprodukcji
- Oczekiwane zachowanie
- Środowisko (OS, Node.js wersja, przeglądarka)

## Propozycje funkcji

Dla nowych funkcji otwórz Issue z etykietą "enhancement" zawierające:
- Opis funkcji
- Dlaczego jest potrzebna
- Jak powinna działać
- Szkice UI jeśli dotyczy

## 🔒 Wytyczne bezpieczeństwa (Security Guidelines)

### Zgłaszanie luk bezpieczeństwa

**⚠️ WAŻNE:** Jeśli odkryjesz lukę bezpieczeństwa, NIE twórz publicznego issue!

Zamiast tego postępuj zgodnie z naszą [Polityką bezpieczeństwa](SECURITY.md):
- Wyślij email na: security@biuro.pl
- Dołącz szczegółowe kroki reprodukcji
- Pozwól rozsądny czas na naprawę przed publicznym ujawnieniem

### Najlepsze praktyki bezpieczeństwa

#### Dla współtwórców:
- Nigdy nie commituj wrażliwych danych (hasła, klucze API, tokeny)
- Używaj zmiennych środowiskowych do konfiguracji
- Waliduj wszystkie dane wejściowe od użytkowników
- Używaj parametryzowanych zapytań
- Implementuj odpowiednie obsługę błędów bez ujawniania wrażliwych informacji
- Aktualizuj zależności regularnie

#### Lista kontrolna code review:
- [ ] Brak zahardkodowanych sekretów lub danych uwierzytelniających
- [ ] Walidacja input na wszystkich danych od użytkowników
- [ ] Odpowiednia obsługa błędów (bez stack trace'ów w produkcji)
- [ ] Sprawdzanie autoryzacji/uwierzytelniania
- [ ] Zapobieganie SQL injection (parametryzowane zapytania)
- [ ] Zapobieganie XSS (prawidłowe escapowanie/sanitizacja)
- [ ] Ochrona CSRF gdzie dotyczy

## Testowanie

Przed wysłaniem PR:
- Uruchom `npm run lint` we wszystkich modułach
- Zbuduj frontend: `npm run build`
- Przetestuj funkcjonalności manualnie
- Sprawdź czy CI przechodzi

## Licencja

Współtworząc, zgadzasz się że Twój kod będzie na licencji MIT.