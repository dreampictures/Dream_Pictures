# Dream Pictures — Project Reference

## Overview
Full-stack photography/videography website for "Dream Pictures" built on TypeScript PERN stack.
Deployed at: `https://dream-pictures-2026.fly.dev`

## Stack
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui + wouter
- **Backend**: Express (Node.js)
- **Database**: Neon PostgreSQL (via Drizzle ORM)
- **Storage**: Cloudflare R2 (`albums` bucket)
- **CDN**: `cdn.thedreampictures.com`
- **Deployment**: Fly.io (app: `dream-pictures-2026`, region: `bom`)

## Key URLs
- Public site: `https://dream-pictures-2026.fly.dev`
- Album viewer: `https://album.thedreampictures.com/golden-album/{code}`
- Admin panel: `/admin` → `/admin/dashboard`
- **CRM (hidden)**: `/admin-work-secret` — uses same admin credentials

## Environment Secrets (Fly.io)
- `DATABASE_URL` — Neon PostgreSQL connection string
- `ADMIN_USERNAME`, `ADMIN_PASSWORD` — admin login credentials
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME=albums`

## Database Tables
- `portfolio_items` — portfolio gallery images
- `contact_messages` — inquiry form submissions
- `albums`, `album_images`, `albums_cache` — album metadata
- `album_passwords` — per-album password protection
- `crm_clients` — CRM client personal info (name, phone, dob, anniversary, address, notes)
- `crm_works` — CRM work/payment tracking (client, description, price, advance, status)

## Features
- **Public site**: Home, Portfolio, About, Terms, Contact
- **Golden Album flipbook**: `/golden-album/:code` with CDN image viewer
- **Admin dashboard**: R2 album auto-discovery, QR generation, password management, contacts
- **CRM dashboard** (`/admin-work-secret`): Client management, work tracking, billing, birthday/anniversary alerts, CSV export

## CDN Path Format
`cdn.thedreampictures.com/{code}/001.jpg` (NO `/albums/` prefix)

## Deploy Command
```bash
curl -L https://fly.io/install.sh | sh
~/.fly/bin/flyctl deploy --remote-only --strategy=immediate --ha=false --wait-timeout 180 --app dream-pictures-2026
```
