-- Definicja linii w MPKCreator (Lua)
local linia = {
    numer = "124",
    typ = "autobus",
    relacja = {
        poczatek = "Krzęcin Pętla",
        kraniec_posredni = "Krzęcin Wolin Pętla", -- pętla zwrotna w środku trasy (fix #2)
        koniec = "Krzęcin Pętla"
    },
    przystanki = {
        { id = "KP01", nazwa = "Krzęcin Pętla 01", czas_przejazdu = 0 },
        { id = "KSZ1", nazwa = "Krzęcin Szczęsna Zachód 01", czas_przejazdu = 3 },
        { id = "KWP1", nazwa = "Krzęcin Wolin Pętla 01", czas_przejazdu = 7, kraniec = true },
        { id = "KSZ2", nazwa = "Krzęcin Szczęsna Zachód 02", czas_przejazdu = 11 },
        { id = "KP02", nazwa = "Krzęcin Pętla 02", czas_przejazdu = 14 }
    },
    brygady = {
        { brygada = "124-01", tabor = "KR986", model = "Solaris Urbino 12 IV" }
    }
}

-- Funkcja zwracająca poprawną nazwę relacji (bez "Krzęcin Pętla - Krzęcin Pętla")
function linia:pobierzRelacje()
    local cel = self.relacja.kraniec_posredni or self.relacja.koniec
    return self.relacja.poczatek .. " - " .. cel
end

print("Linia " .. linia.numer .. ": " .. linia:pobierzRelacje())
