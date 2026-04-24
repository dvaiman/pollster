# Pollster

En live-enkät i stil med Slido / Mentimeter. Publiken svarar via en kod (eller QR-kod) från sin telefon, presentatören visar resultaten live med grafer på storskärm.

- Flera sessioner — skapa en ny kod för varje tillfälle
- Realtidsuppdaterade grafer via Supabase Realtime
- QR-kod till enkäten
- CSV-export av rådata
- Anonymt (ingen inloggning för respondenter)
- Gratis hosting: GitHub Pages + Supabase free tier

## Innehåll

- `src/` — React-app (Vite)
- `supabase/schema.sql` — databasschema (kör en gång i Supabase)
- `.github/workflows/deploy.yml` — auto-deploy till GitHub Pages

## Snabbstart

### 1. Skapa ett Supabase-projekt

1. Gå till [supabase.com](https://supabase.com) och skapa ett gratiskonto + nytt projekt.
2. Öppna **SQL Editor** → klistra in hela innehållet från `supabase/schema.sql` → kör.
3. Gå till **Database → Replication** och slå på replication för tabellen `responses` (så att live-uppdateringar funkar).
4. Gå till **Settings → API** och kopiera:
   - **Project URL** → blir `VITE_SUPABASE_URL`
   - **anon public key** → blir `VITE_SUPABASE_ANON_KEY`

### 2. Kör lokalt (valfritt)

```bash
cp .env.example .env
# fyll i dina Supabase-värden
npm install
npm run dev
```

Öppna http://localhost:5173/#/admin, skapa en enkät, och testa på din telefon.

### 3. Deploya till GitHub Pages

1. Pusha repot till GitHub.
2. I ditt repo: **Settings → Pages → Source: GitHub Actions**.
3. **Settings → Secrets and variables → Actions → New repository secret**, lägg till:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_PASSWORD` — valfritt men rekommenderat, skyddar admin-sidan
4. Pusha till `main` så byggs och deployas appen automatiskt.
5. URL blir `https://<användarnamn>.github.io/<repo-namn>/`.

> Om repot heter något annat än `pollster`, fungerar base-pathen automatiskt via `VITE_BASE_PATH` i workflow-filen.

## Användning på plats

1. Gå till `/#/admin`, ange admin-lösenordet.
2. Klicka **+ Ny enkät** → du hamnar på resultatsidan med QR-kod + en 4-teckenskod (t.ex. `AB34`).
3. Visa storskärmen för publiken. De skannar QR eller går till startsidan och anger koden.
4. Svaren dyker upp live.
5. Klicka **Fokus** på en fråga för att förstora en graf när du pratar om den.
6. Klicka **Stäng enkäten** när ni är klara — inga fler svar kan skickas.
7. **Exportera CSV** om du vill spara rådata.

Nästa tillfälle: skapa en ny session i admin — tidigare resultat ligger kvar separat.

## Jämför grupper (t.ex. handledare vs doktorander)

När du skapar en enkät i admin kan du fylla i fältet **"Grupper"** med kommaseparerade namn, t.ex. `Doktorand, Handledare`. Då:

- Första frågan för respondenten blir "Vem är du?" med grupperna som val
- Resultatsidan får filter-chips för att se All / Doktorand / Handledare
- Presentationsläget får en "Jämför grupper"-knapp som visar staplar per grupp sida vid sida
- CSV-exporten får en `group`-kolumn

Lämna fältet tomt om du inte vill använda gruppering — det funkar exakt som innan.

**Uppgradering av befintlig databas:** om du skapade projektet innan detta fanns, kör den här i Supabase SQL Editor (säker att köra flera gånger):

```sql
alter table public.sessions add column if not exists audience_groups text[];
```

## Anpassa frågorna

Frågorna ligger i `src/lib/survey.js`. Stödda typer:

- `single` — en radioknapp
- `multi` — flera kryssrutor (valfri `maxSelect`)
- `scale` — numerisk skala (1–5, 1–7 etc.)

Ändra, commit, push — GitHub Actions bygger om automatiskt.

## Säkerhet

- **Anon key är offentlig by design.** Säkerheten sköts av Postgres Row-Level Security i `schema.sql`. Med default-policies kan vem som helst skapa sessioner — admin-sidan skyddas bara klient-side av `VITE_ADMIN_PASSWORD`. För hårdare skydd: byt ut `sessions_insert_all`/`update`/`delete`-policies mot Supabase Auth-baserade (kräver att admin loggar in).
- Respondentsvar accepteras bara för sessioner med `status = 'open'`.
- Samma webbläsare kan inte skicka flera svar (lagras i `localStorage`). Enkelt att kringgå men bra för att förhindra oavsiktliga dubbletter.

## Licens

MIT — använd fritt.
