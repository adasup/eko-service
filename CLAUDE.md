# Rozpočet App — PWA pro rychlou tvorbu stavebních rozpočtů diktováním

## Přehled projektu

Mobilní PWA aplikace pro řemeslníka (stavební firma Eko-servis). Kamarád nadiktuje seznam položek do telefonu, AI je rozparsuje, spáruje s ceníkem z předchozích zakázek a vytvoří hotový rozpočet. Výsledek se dá exportovat do Excel, PDF nebo odeslat e-mailem.

## Tech stack

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** pro styling
- **IndexedDB** (via `idb` knihovna) pro lokální ukládání dat
- **Claude API** (Anthropic) pro parsování diktátu a párování položek
- **Web Speech API** NENÍ použito — místo toho uživatel používá nativní iOS/Android mikrofon na klávesnici
- **jsPDF** + **jspdf-autotable** pro PDF export
- **SheetJS (xlsx)** pro Excel export
- **PWA** — manifest.json + service worker pro instalaci na plochu

## Architektura

```
src/
├── components/
│   ├── Layout.tsx              # Hlavní layout s bottom navigation
│   ├── BottomNav.tsx           # Navigace: Přehled, Nový, Nastavení
│   ├── screens/
│   │   ├── HomeScreen.tsx      # Seznam rozpočtů + tlačítko nový
│   │   ├── DictateScreen.tsx   # Push-to-talk diktování + live rozpoznávání
│   │   ├── ResultScreen.tsx    # Výsledek rozpočtu + export akce
│   │   ├── EmailScreen.tsx     # Náhled a odeslání e-mailu
│   │   └── SettingsScreen.tsx  # API klíč, ceníky, záloha, export nastavení
│   ├── DictateButton.tsx       # Push-to-talk kruhové tlačítko (hold = record)
│   ├── LiveItemList.tsx        # Průběžný seznam rozpoznaných položek
│   ├── ResultItemList.tsx      # Finální seznam s cenami a stavy
│   ├── TranscriptBlock.tsx     # Rozbalitelný blok s původním přepisem
│   ├── ExportActions.tsx       # Tři tlačítka: Excel, PDF, E-mail
│   ├── PriceListUpload.tsx     # Upload ceníku (xlsx/csv/json)
│   └── BackupRestore.tsx       # Zálohování a obnova dat
├── hooks/
│   ├── useDatabase.ts          # IndexedDB CRUD operace
│   ├── useSpeechRecording.ts   # MediaRecorder + push-to-talk logika
│   ├── useClaudeAPI.ts         # Volání Claude API pro parsování
│   └── useExport.ts            # PDF a Excel generování
├── lib/
│   ├── db.ts                   # IndexedDB schema a inicializace (idb)
│   ├── claude.ts               # Claude API client — parsování + párování
│   ├── export-pdf.ts           # Generování PDF s hlavičkou
│   ├── export-xlsx.ts          # Generování Excel souboru
│   ├── email.ts                # Generování mailto: odkazu s přílohou
│   └── priceList.ts            # Načtení a normalizace ceníků
├── types/
│   └── index.ts                # TypeScript typy
├── data/
│   └── default-cenik.json      # Výchozí ceník extrahovaný z historických rozpočtů
├── App.tsx
├── main.tsx
└── index.css                   # Tailwind directives + custom styles
```

## Datový model (TypeScript typy)

```typescript
interface BudgetItem {
  id: string;
  name: string;           // Normalizovaný název ("Obklad koupelna")
  rawText: string;        // Původní text z diktátu ("obklady do koupelny")
  unit: string;           // MJ: "m2", "ks", "mb", "soub.", "kpl"
  quantity: number;        
  unitPrice: number;       
  totalPrice: number;      
  matchType: 'matched' | 'estimated' | 'manual'; // z ceníku / AI odhad / ručně
  matchedPriceItem?: string; // Název položky v ceníku, se kterou se spárovalo
  category: string;        // Sekce: "Bourání a demontáže", "Obklady a dlažby" atd.
}

interface Budget {
  id: string;
  name: string;            // "Koupelna — Novákovi"
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'done';
  items: BudgetItem[];
  transcripts: Transcript[];  // Všechny diktáty k tomuto rozpočtu
  priceListIds: string[];     // Které ceníky byly použity
  totalWithoutVat: number;
  vatRate: number;            // default 21
}

interface Transcript {
  id: string;
  text: string;            // Přepis diktátu
  createdAt: Date;
  wordCount: number;
  audioBlob?: Blob;        // Volitelně uložený audio záznam
}

interface PriceListItem {
  name: string;
  unit: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  occurrences: number;
  category: string;
  projects: string[];
}

interface PriceList {
  id: string;
  name: string;
  items: PriceListItem[];
  uploadedAt: Date;
  source: string;          // "xlsx" | "csv" | "json"
}

interface AppSettings {
  claudeApiKey: string;
  claudeModel: string;     // default "claude-sonnet-4-20250514"
  vatRate: number;          // default 21
  senderEmail: string;
  senderName: string;
  companyName: string;
  companyAddress: string;
  pdfLogoBase64?: string;
  autoBackupReminder: boolean;
  lastBackupDate?: Date;
}
```

## Klíčové funkce

### 1. Push-to-talk diktování
- Uživatel DRŽÍ prst na velkém kruhovém tlačítku mikrofonu
- Dokud drží = MediaRecorder nahrává audio
- Po puštění = audio se přepíše do textu (zatím: uživatel používá iOS klávesnici s mikrofonem, text se vkládá do textarea)
- Alternativní flow: uživatel prostě píše/diktuje do textarea a zmáčkne "Zpracovat"
- Každý diktát se ukládá jako Transcript

### 2. AI zpracování (Claude API)
- Po každém ukončeném diktátu se text pošle na Claude API
- Prompt obsahuje:
  1. Nadiktovaný text
  2. Seznam položek z aktivního ceníku (name + unit + avgPrice)
  3. Instrukce: "Rozparsuj text na položky. Pro každou urči název, množství, jednotku. Spáruj s ceníkem — pokud najdeš shodu, použij cenu z ceníku. Pokud ne, odhadni cenu. Vrať JSON."
- Response se parsuje a položky se přidají do rozpočtu
- Důležité: Claude musí rozumět české morfologii, hovorovým výrazům, zkratkám

### 3. Ceník a párování
- Výchozí ceník je v `src/data/default-cenik.json` (476 položek z 8 historických rozpočtů)
- Uživatel může nahrát další ceníky (xlsx, csv, json)
- Při párování se hledá nejbližší shoda názvu položky
- AI dělá fuzzy matching — "kachlíky" = "obklad", "umejvák" = "umyvadlo"

### 4. Export
- **Excel**: SheetJS generuje .xlsx se záhlavím, položkami, součty
- **PDF**: jsPDF s hlavičkou firmy (logo, adresa), tabulkou položek, DPH, celkem
- **E-mail**: Generuje mailto: link s předvyplněným předmětem, textem a instrukcí pro přílohu. Text je generický: cenová nabídka, částky, kontakt.

### 5. Ukládání dat
- Vše v IndexedDB přes `idb` knihovnu
- Stores: budgets, priceLists, settings, transcripts
- Záloha: export všech dat jako jeden JSON soubor
- Obnova: import JSON souboru zpět do IndexedDB

## UI Mockupy

Vizuální reference všech obrazovek je v `docs/ui-mockups.html` — otevři v prohlížeči. Obsahuje 5 kompletních mockupů v mobilním rámu (375x750px):

1. **HomeScreen** — seznam rozpočtů s kartami (název, datum, počet položek, celková cena, badge stavu)
2. **DictateScreen** — push-to-talk mikrofon, progress kroky (Ceník → Diktování → Kontrola), live seznam rozpoznaných položek s cenami, průběžný součet, počítadlo nahrávek
3. **ResultScreen** — celkový součet, 3 export tlačítka (Excel/PDF/E-mail), rozbalitelný přepis diktátu s akcemi, seznam položek členěný do sekcí (Materiál/Práce) s matchType indikátory
4. **EmailScreen** — formulář s příjemcem, předmětem, přílohami (PDF+Excel badge), generický text nabídky, přepínač šablon
5. **SettingsScreen** — API klíč, ceníky s uploadem, storage přehled s progress barem, záloha/obnova tlačítka, e-mail a export nastavení, danger zone

Implementuj UI přesně podle těchto mockupů — barvy, rozměry, spacing, ikony, stavy.

## UI Design specifikace

### Barvy
- Primární: `#1D9E75` (zelená) — tlačítka, aktivní prvky, mikrofon
- Pozadí: bílá (#FFFFFF) / light gray (#F5F5F5)
- Text: #1A1A1A (primary), #6B7280 (secondary), #9CA3AF (tertiary)
- Matched: zelená (#0F6E56)
- Estimated: oranžová (#BA7517)
- Error/danger: červená (#A32D2D)

### Font
- DM Sans (Google Fonts) — 400 regular, 500 medium

### Layout
- Mobilní-first, max-width 480px centered
- Bottom navigation: 3 položky (Přehled, Nový, Nastavení)
- Sticky header s názvem obrazovky
- Cards s border-radius 12px, light shadow

### Komponenty (odpovídají mockupům)
- Velké kulaté push-to-talk tlačítko (80px) se zeleným pulsujícím kruhem při nahrávání
- Karty rozpočtů s badge (Hotovo/Koncept), datem, počtem položek, celkovou cenou
- Rozbalitelný blok přepisu s akcemi (Upravit, Zpracovat znovu, Kopírovat)
- Tři export tlačítka v gridu (Excel, PDF, E-mail)
- Průběžný součet lišta

## Claude API prompt template

```
Jsi asistent pro tvorbu stavebních rozpočtů. Dostaneš nadiktovaný text v češtině a ceník položek.

NADIKTOVANÝ TEXT:
"""
{transcriptText}
"""

CENÍK (JSON):
{priceListJSON}

ÚKOL:
1. Rozparsuj nadiktovaný text na jednotlivé položky rozpočtu
2. Pro každou položku urči: název (normalizovaný), množství, měrnou jednotku
3. Spáruj s ceníkem — hledej nejbližší shodu (pozor na české skloňování, hovorové výrazy, zkratky)
4. Pokud položka je v ceníku, použij průměrnou cenu. Pokud ne, odhadni cenu na základě znalosti českého stavebního trhu.

Vrať POUZE platný JSON (žádný markdown, žádné vysvětlování):
{
  "items": [
    {
      "name": "Obklad koupelna",
      "rawText": "obklady do koupelny",
      "unit": "m2",
      "quantity": 25,
      "unitPrice": 890,
      "totalPrice": 22250,
      "matchType": "matched",
      "matchedPriceItem": "Obklad koupelna",
      "category": "Obklady a dlažby"
    }
  ]
}
```

## PWA konfigurace

- `manifest.json`: name "Rozpočty", short_name "Rozpočty", theme_color #1D9E75, background_color #FFFFFF, display "standalone", icons 192x192 a 512x512
- Service worker: cache-first pro statické assety, network-first pro API volání
- Vite plugin: `vite-plugin-pwa`

## Příkazy

```bash
npm install          # Instalace závislostí
npm run dev          # Dev server
npm run build        # Production build
npm run preview      # Preview production buildu
```

## Poznámky pro implementaci

- API klíč se ukládá POUZE lokálně v IndexedDB, nikdy se neposílá nikam jinam než na api.anthropic.com
- CORS: Claude API nepodporuje přímé volání z browseru — je potřeba buď proxy server, nebo Anthropic CORS headers. Pro prototyp zatím použij přímé volání, v produkci bude potřeba proxy (Cloudflare Worker).
- Jazyk UI: čeština
- Responsive: optimalizováno pro mobilní zařízení, ale funkční i na desktopu
- Offline: ceník a rozpočty dostupné offline, AI zpracování vyžaduje internet
