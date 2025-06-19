# 🗄️ Database Setup voor FraFill Admin Panel

## Huidige Status
- **✅ Admin Panel Werkt**: Gebruikt tijdelijk in-memory storage
- **⚠️ Database Niet Geconfigureerd**: PostgreSQL nog niet verbonden
- **🔄 Klaar voor Upgrade**: Productie API's zijn al gemaakt

## Stap 1: PostgreSQL Database Aanmaken

### Optie A: Vercel Postgres (Aanbevolen)
1. Ga naar je Vercel dashboard
2. Selecteer je `fraffil` project
3. Ga naar **Storage** tab
4. Klik **Create Database** > **Postgres**
5. Kies een naam (bijv. `fraffil-db`)
6. Selecteer een regio (Amsterdam voor Europa)
7. Klik **Create**

### Optie B: Externe PostgreSQL Provider
- **Neon**: https://neon.tech (gratis tier)
- **Supabase**: https://supabase.com (gratis tier)
- **Railway**: https://railway.app (gratis tier)

## Stap 2: Environment Variables Instellen

Na database aanmaak krijg je een connection string zoals:
```postgresql://username:password@host:5432/database?sslmode=require
```

### In Vercel Dashboard:
1. Ga naar **Settings** > **Environment Variables**
2. Voeg toe:
   - **Name**: `POSTGRES_URL`
   - **Value**: Je database connection string
   - **Environment**: Production, Preview, Development

## Stap 3: Database Schema Initialiseren

Zodra `POSTGRES_URL` is ingesteld, wordt automatisch:
- **influencers** tabel aangemaakt
- **admin_users** tabel aangemaakt  
- **system_settings** tabel aangemaakt

## Stap 4: Admin Panel Upgraden naar Database

### Automatische Upgrade:
1. Verander in `pages/admin/users.js`:
   ```javascript
   // Van:
   const response = await fetch('/api/admin/users-working', {
   
   // Naar:
   const response = await fetch('/api/admin/users-production', {
   ```

2. Verander in `pages/admin/dashboard.js`:
   ```javascript
   // Van:
   const statsResponse = await fetch('/api/admin/stats-working');
   
   // Naar:
   const statsResponse = await fetch('/api/admin/stats-production');
   ```

### Of gebruik Smart Fallback (Aanbevolen):
De smart fallback API's proberen eerst database, dan in-memory:
- `/api/admin/users-fallback` - Altijd werkend
- Automatische retry logic in frontend

## Database Schema

### influencers
```sql
CREATE TABLE influencers (
  id SERIAL PRIMARY KEY,
  ref VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  instagram VARCHAR(100),
  tiktok VARCHAR(100),
  youtube VARCHAR(100),
  commission DECIMAL(5,2) DEFAULT 10.00,
  status VARCHAR(20) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### admin_users
```sql
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);
```

## Testing Database Connection

### Test API:
```bash
curl https://fraffil.vercel.app/api/admin/test-db
```

### Expected Response (Working):
```json
{
  "success": true,
  "environment": {
    "hasPostgresUrl": true,
    "postgresUrlLength": 120
  }
}
```

## Troubleshooting

### Network Error 500:
- Check if `POSTGRES_URL` is set in Vercel environment variables
- Verify database is accessible from Vercel's servers
- Check Vercel function logs for detailed errors

### Connection Refused:
- Database server might be sleeping (free tiers)
- Check firewall settings
- Verify SSL requirements

### Module Errors:
- All production API's use CommonJS (`module.exports`)
- No ES6/CommonJS mixing issues

## Rollback Plan

Als database problemen geeft:
1. Admin panel blijft werken met in-memory storage
2. Geen data verlies - graceful degradation
3. Switch terug naar `users-working` API indien nodig

## Volgende Stappen

1. **Database Setup** (deze handleiding)
2. **Google Sheets Integratie** voor order data
3. **Email Templates** voor gebruiker communicatie
4. **Analytics Dashboard** met echte sales data

---

**Status**: Database API's zijn klaar, wachten op `POSTGRES_URL` configuratie. 