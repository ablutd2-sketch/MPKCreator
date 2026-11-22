-- src/api/LinieRef.lua
-- Referencje linii i kierunków docelowych dla MPKCreator (fix #2)

local LinieRef = {
    ["111"] = {
        numer = "111",
        typ = "autobus",
        poczatek = "Krzęcin Pętla",
        kraniec = "Krzęcin Sosnowicka",
        koniec = "Krzęcin Pętla",
        tabor = { "KR222", "KR223", "KR225" }
    },
    ["123"] = {
        numer = "123",
        typ = "autobus",
        poczatek = "Krzęcin Pętla",
        kraniec = "Krzęcin Wierzbowa",
        koniec = "Krzęcin Pętla",
        tabor = { "KR315", "KR316", "KR202" }
    },
    ["124"] = {
        numer = "124",
        typ = "autobus",
        poczatek = "Krzęcin Pętla",
        kraniec = "Krzęcin Wolin Pętla",
        koniec = "Krzęcin Pętla",
        tabor = { "KR986" }
    },
    ["133"] = {
        numer = "133",
        typ = "autobus",
        poczatek = "Krzęcin Pętla",
        kraniec = "Krzęcin Facimiech Pętla",
        koniec = "Krzęcin Pętla",
        tabor = { "KR344", "KR201" }
    },
    ["144"] = {
        numer = "144",
        typ = "autobus",
        poczatek = "Krzęcin Pętla",
        kraniec = "Krzęcin Kościół Pętla",
        koniec = "Krzęcin Pętla",
        tabor = { "KR431", "KR001" }
    },
    ["173"] = {
        numer = "173",
        typ = "autobus",
        poczatek = "Krzęcin Pętla",
        kraniec = "Krzęcin Cmentarz Pętla",
        koniec = "Krzęcin Pętla",
        tabor = { "KR058", "KR998", "KR999" }
    },
    ["178"] = {
        numer = "178",
        typ = "autobus",
        poczatek = "Krzęcin Pętla",
        kraniec = "Krzęcin Lipowa Pętla",
        koniec = "Krzęcin Pętla",
        tabor = { "KR002", "KR003" }
    },
    ["244"] = {
        numer = "244",
        typ = "autobus",
        poczatek = "Krzęcin Pętla",
        kraniec = "Polanka Hallera",
        koniec = "Krzęcin Pętla",
        tabor = { "KR023" }
    }
}

-- Zwraca poprawną relację (np. "Krzęcin Pętla - Krzęcin Wolin Pętla")
function LinieRef.pobierzRelacje(numerLinii)
    local linia = LinieRef[tostring(numerLinii)]
    if not linia then
        return "Nieznana linia"
    end
    local cel = linia.kraniec or linia.koniec
    return linia.poczatek .. " - " .. cel
end

-- Zwraca pełne dane referencyjne linii po numerze
function LinieRef.pobierzLinie(numerLinii)
    return LinieRef[tostring(numerLinii)]
end

return LinieRef
