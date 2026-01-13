import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'privacy' | 'terms' | 'cookies';
}

export function PolicyDialog({ open, onOpenChange, type }: PolicyDialogProps) {
  const content = {
    privacy: {
      title: "Polityka Prywatności",
      sections: [
        {
          title: "1. Informacje ogólne",
          content: "Niniejsza Polityka Prywatności określa zasady przetwarzania i ochrony danych osobowych przekazanych przez Użytkowników w związku z korzystaniem przez nich z usług oferowanych przez Real Estate CRM."
        },
        {
          title: "2. Administrator danych",
          content: "Administratorem danych osobowych jest Real Estate CRM z siedzibą pod adresem ul. Przykładowa 1, 00-000 Miasto."
        },
        {
          title: "3. Rodzaj przetwarzanych danych",
          content: "W ramach świadczenia usług możemy przetwarzać następujące dane osobowe: imię i nazwisko, adres e-mail, numer telefonu, adres zamieszkania lub korespondencyjny."
        },
        {
          title: "4. Cel przetwarzania danych",
          content: "Dane osobowe są przetwarzane w celu: realizacji usług pośrednictwa w obrocie nieruchomościami, kontaktu z klientem, realizacji obowiązków prawnych, marketingu usług własnych."
        },
        {
          title: "5. Prawa użytkowników",
          content: "Użytkownikowi przysługuje prawo dostępu do treści swoich danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, prawo do przenoszenia danych, prawo wniesienia sprzeciwu."
        },
        {
          title: "6. Pliki cookies",
          content: "Strona wykorzystuje pliki cookies w celu zapewnienia prawidłowego działania serwisu oraz analizy ruchu. Szczegółowe informacje znajdują się w Polityce Cookies."
        }
      ]
    },
    terms: {
      title: "Regulamin",
      sections: [
        {
          title: "1. Postanowienia ogólne",
          content: "Niniejszy Regulamin określa zasady korzystania ze strony internetowej Real Estate CRM oraz świadczonych przez nią usług."
        },
        {
          title: "2. Definicje",
          content: "Serwis - strona internetowa działająca pod adresem www.realestate.com. Użytkownik - osoba fizyczna, osoba prawna lub jednostka organizacyjna nieposiadająca osobowości prawnej, korzystająca z Serwisu."
        },
        {
          title: "3. Usługi oferowane",
          content: "Serwis oferuje usługi pośrednictwa w obrocie nieruchomościami, doradztwo, wycenę nieruchomości oraz prezentację ofert nieruchomości."
        },
        {
          title: "4. Warunki korzystania",
          content: "Użytkownik zobowiązuje się do korzystania z Serwisu zgodnie z obowiązującym prawem, postanowieniami Regulaminu oraz ogólnymi zasadami korzystania z sieci Internet."
        },
        {
          title: "5. Odpowiedzialność",
          content: "Administrator dokłada wszelkich starań, aby informacje zamieszczone w Serwisie były aktualne i rzetelne. Nie ponosi jednak odpowiedzialności za ewentualne błędy czy nieścisłości."
        },
        {
          title: "6. Postanowienia końcowe",
          content: "Administrator zastrzega sobie prawo do wprowadzenia zmian w Regulaminie. O wszelkich zmianach Użytkownicy zostaną poinformowani poprzez publikację nowej wersji Regulaminu."
        }
      ]
    },
    cookies: {
      title: "Polityka Cookies",
      sections: [
        {
          title: "1. Co to są cookies?",
          content: "Cookies (ciasteczka) to małe pliki tekstowe zapisywane na urządzeniu Użytkownika podczas korzystania ze strony internetowej."
        },
        {
          title: "2. Rodzaje wykorzystywanych cookies",
          content: "Niezbędne cookies - umożliwiają podstawowe funkcje strony. Analityczne cookies - pozwalają na analizę sposobu korzystania ze strony. Marketingowe cookies - służą do personalizacji reklam."
        },
        {
          title: "3. Cel wykorzystania cookies",
          content: "Wykorzystujemy cookies w celu: zapewnienia prawidłowego działania strony, dostosowania zawartości do preferencji użytkownika, prowadzenia analiz statystycznych."
        },
        {
          title: "4. Zarządzanie cookies",
          content: "Użytkownik może w każdej chwili zmienić ustawienia cookies w swojej przeglądarce internetowej. Wyłączenie cookies może wpłynąć na funkcjonalność strony."
        },
        {
          title: "5. Cookies firm trzecich",
          content: "Nasza strona może wykorzystywać cookies firm trzecich, takich jak Google Analytics, w celu analizy ruchu i zachowań użytkowników."
        },
        {
          title: "6. Kontakt",
          content: "W przypadku pytań dotyczących cookies prosimy o kontakt pod adresem: biuro@realestate.com"
        }
      ]
    }
  };

  const currentContent = content[type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {currentContent.title}
          </DialogTitle>
          <DialogDescription>
            Ostatnia aktualizacja: Listopad 2025
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto h-[60vh] pr-4">
          <div className="space-y-6">
            {currentContent.sections.map((section, index) => (
              <div key={index} className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {section.title}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
