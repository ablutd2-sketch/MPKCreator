# 🚍 MPKCreator

**MPKCreator** to aplikacja webowa do tworzenia, symulowania i śledzenia sieci komunikacji miejskiej. Łączy widok radaru pojazdów na żywo (**Dane na żywo**) z rozbudowanym modułem planistycznym (**Tryb Symulacji**) przeznaczonym dla techników, dyspozytorów i zarządu.

---

## ✨ Główne funkcje MPKCreator

* **Mapa i Radar pojazdów (Dane na żywo):** Podgląd aktualnego położenia autobusów i tramwajów w czasie rzeczywistym z dokładnym odwzorowaniem przebiegu tras po siatce ulic.
* **Karta pojazdu i dedykowane malatury:** Szczegółowy podgląd wozu z numerem taborowym, modelem pojazdu oraz grafiką malatury, numerem brygady i rozkładem odjazdów z kolejnych przystanków.
* **Panel taborowy i brygadowy:** Zarządzanie flotą z podziałem na pojazdy aktywne w ruchu oraz tabor rezerwowy.
* **Tryb Symulacji (moduł wewnętrzny — technicy i zarząd):** Testowanie nowych rozkładów jazdy z przyspieszeniem czasu (`x1`, `x5` itd.), weryfikacja przepustowości pętli, koordynacji taktów oraz obiegu brygad przed wdrożeniem do ruchu.

---

## ⚙️ Konfiguracja środowiska

1. **Tryb Rozkładowy / Tryb Symulacji:**
   * Działa od razu po uruchomieniu (wybierz **Skip** przy konfiguracji sekretów, jeśli nie korzystasz z zewnętrznego nadajnika GPS).
2. **Tryb Danych na Żywo (GPS Webhook):**
   * `GPS_WEBHOOK_TOKEN` – klucz autoryzacyjny wymagany w nagłówku `x-api-key` dla zapytań wysyłanych na `/api/gps`.
   * Klucz API podkładu mapowego (np. Carto / MapLibre) – wymagany do ładowania pełnej mapy ulic bez znaku wodnego `API KEY REQUIRED`.

---

## 🛠️ Dziennik zmian i bieżące poprawki (Changelog)

* **Geometria tras (`shapes`):** Poprawiono prowadzenie tras po realnych ulicach, eliminując przeloty w linii prostej między przystankami.
* **Współrzędne przystanków i pętli:** Zweryfikowano lokalizacje przystanków końcowych i pośrednich.
* **Bieżący zakres prac:**
  * Poprawa obsługi zjazdów na zajezdnię po ostatnim kursie rozkładowym.
  * Dalsze poprawki techniczne i rozbudowa modułów aplikacji.
