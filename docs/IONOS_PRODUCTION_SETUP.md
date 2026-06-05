# Products4ThePeople IONOS Production Setup Walkthrough

This guide walks through getting Products4ThePeople running in production on an IONOS Ubuntu VPS.

The recommended production layout is:

- `https://products4thepeople.com` serves the built React storefront/admin app from Nginx.
- `https://products4thepeople.com/api/*` proxies to the Express API running on port `4000`.
- PostgreSQL stores products, orders, customers, SEO content, experiments, and research data.
- Stripe, Google Login, AI, and analytics are added after the core site is online.

Useful references:

- IONOS SSH guide: https://docs.ionos.com/cloud/security/ssh-key-manager/connect-via-ssh/connect-via-ssh-terminal
- IONOS Cloud Servers getting started: https://www.ionos.com/help/server-cloud-infrastructure/getting-started/cloud-servers-getting-started/
- IONOS PostgreSQL DBaaS docs: https://docs.ionos.com/cloud/databases/postgresql
- Stripe API keys: https://docs.stripe.com/keys
- Google OAuth client ID: https://developers.google.com/identity/oauth2/web/guides/get-google-api-clientid
- OpenAI API keys/auth: https://platform.openai.com/docs/api-reference/authentication

---

## 0. What To Set Up First

Do these in this order:

1. IONOS VPS, SSH, firewall, domain DNS.
2. Node.js, Nginx, PM2, and project files.
3. PostgreSQL database.
4. `.env` production settings.
5. Build frontend and start API.
6. Nginx reverse proxy and HTTPS.
7. Stripe live checkout.
8. Google Login.
9. AI provider key.
10. Analytics pixels.
11. Optional Medusa connection.

Do not start with Stripe/Google/AI. The site needs a working VPS, API, and database first.

---

## 1. Prepare Your Local Info

Before logging into the server, write these down:

```bash
DOMAIN="products4thepeople.com"
WWW_DOMAIN="www.products4thepeople.com"
SERVER_IP="YOUR_IONOS_SERVER_IP"
REPO_URL="https://github.com/thescoobmeisterm/Products4thePeople.git"
APP_DIR="/var/www/products4thepeople"
API_PORT="4000"
```

You will also need:

- IONOS VPS SSH login.
- GitHub repo access.
- Stripe live secret key.
- Google OAuth Web Client ID.
- OpenAI API key, if using AI.
- GA4/Meta/TikTok pixel IDs, if using analytics.

---

## 2. Point DNS To The VPS

In IONOS domain DNS settings, create or update:

```text
Type: A
Host: @
Value: YOUR_IONOS_SERVER_IP

Type: A
Host: www
Value: YOUR_IONOS_SERVER_IP
```

Optional API subdomain if you later want `api.products4thepeople.com`:

```text
Type: A
Host: api
Value: YOUR_IONOS_SERVER_IP
```

For the setup below, you do not need a separate API subdomain because Nginx will proxy `/api` on the main domain.

Check DNS from your local machine:

```bash
nslookup products4thepeople.com
nslookup www.products4thepeople.com
```

Wait until both point to your VPS IP.

---

## 3. SSH Into The VPS

From your local terminal:

```bash
ssh root@YOUR_IONOS_SERVER_IP
```

If IONOS gave you a private key:

```bash
chmod 600 ~/Downloads/your-ionos-key.pem
ssh -i ~/Downloads/your-ionos-key.pem root@YOUR_IONOS_SERVER_IP
```

Update the server:

```bash
apt update && apt upgrade -y
apt install -y curl git unzip ufw nginx postgresql postgresql-contrib
```

Create a non-root deploy user:

```bash
adduser deploy
usermod -aG sudo deploy
```

Copy your SSH key to the deploy user:

```bash
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

Log out and back in:

```bash
exit
ssh deploy@YOUR_IONOS_SERVER_IP
```

---

## 4. Configure Firewall

IONOS may also have a network firewall in the control panel. Make sure ports `22`, `80`, and `443` are allowed there.

On Ubuntu:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Do not expose port `4000` publicly. It should only be reached by Nginx on the same server.

---

## 5. Install Node.js 22 And PM2

Vite 7 expects a modern Node version. Use Node 22 LTS/current:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

Install PM2 globally:

```bash
sudo npm install -g pm2
pm2 -v
```

Enable PM2 startup:

```bash
pm2 startup systemd
```

PM2 will print a `sudo env PATH=... pm2 startup ...` command. Copy and run that command exactly.

---

## 6. Clone The Project

```bash
sudo mkdir -p /var/www
sudo chown -R deploy:deploy /var/www
git clone https://github.com/thescoobmeisterm/Products4thePeople.git /var/www/products4thepeople
cd /var/www/products4thepeople
npm install
```

---

## 7. Set Up PostgreSQL

You have two good options.

### Option A: Local PostgreSQL On The VPS

This is the fastest way to get production working.

```bash
sudo -u postgres psql
```

Inside `psql`, run:

```sql
CREATE DATABASE products4thepeople;
CREATE USER p4tp_app WITH ENCRYPTED PASSWORD 'CHANGE_THIS_TO_A_LONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE products4thepeople TO p4tp_app;
\c products4thepeople
GRANT ALL ON SCHEMA public TO p4tp_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO p4tp_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO p4tp_app;
\q
```

Your local database URL will be:

```bash
postgres://p4tp_app:CHANGE_THIS_TO_A_LONG_PASSWORD@localhost:5432/products4thepeople
```

### Option B: IONOS Managed PostgreSQL

Use IONOS Cloud PostgreSQL DBaaS if you want managed backups, scaling, and less server maintenance.

After creating the cluster, use the connection details from IONOS:

```bash
postgres://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
```

IONOS DBaaS encrypts client connections. If IONOS gives you a TLS/SSL requirement, keep `sslmode=require` in the URL.

---

## 8. Create The Production `.env`

From the project folder:

```bash
cd /var/www/products4thepeople
cp .env.example .env
nano .env
```

Use this production template:

```env
DATABASE_URL=postgres://p4tp_app:CHANGE_THIS_TO_A_LONG_PASSWORD@localhost:5432/products4thepeople
API_PORT=4000
CORS_ORIGIN=https://products4thepeople.com
VITE_API_BASE_URL=/api

VITE_ADMIN_EMAIL=your-admin-email@example.com
VITE_ADMIN_PASSWORD=CHANGE_THIS_TO_A_LONG_ADMIN_PASSWORD

STRIPE_SECRET_KEY=

VITE_GOOGLE_CLIENT_ID=
OPENAI_API_KEY=

PUBLIC_SITE_URL=https://products4thepeople.com
PUBLIC_APP_BASE=/

BASIC_TAX_RATE=0.06
FREE_SHIPPING_THRESHOLD=75
FLAT_SHIPPING=7

VITE_GA4_MEASUREMENT_ID=
VITE_META_PIXEL_ID=
VITE_TIKTOK_PIXEL_ID=

VITE_MEDUSA_BACKEND_URL=
VITE_MEDUSA_ADMIN_API_KEY=
MEDUSA_BACKEND_URL=
MEDUSA_ADMIN_API_KEY=
```

Save in nano:

```text
Ctrl+O
Enter
Ctrl+X
```

Important:

- `VITE_*` variables are baked into the React build. If you change them, rebuild the frontend.
- Non-`VITE_*` API variables need an API restart.
- Never commit `.env`.

---

## 9. Test Database/API Locally On The Server

Run the API once in the foreground:

```bash
cd /var/www/products4thepeople
npm run start:api
```

You should see:

```text
PostgreSQL database connected successfully
P4tP API Server running on http://localhost:4000
```

In a second SSH terminal, test:

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/products
```

If it works, stop the foreground API with `Ctrl+C`.

---

## 10. Build The Frontend

```bash
cd /var/www/products4thepeople
npm run build
```

The static production files will be in:

```bash
/var/www/products4thepeople/dist
```

---

## 11. Start The API With PM2

```bash
cd /var/www/products4thepeople
pm2 start npm --name p4tp-api -- run start:api
pm2 status
pm2 logs p4tp-api
```

Save the PM2 process list:

```bash
pm2 save
```

Useful PM2 commands:

```bash
pm2 restart p4tp-api
pm2 stop p4tp-api
pm2 logs p4tp-api
pm2 monit
```

---

## 12. Configure Nginx

Create the site config:

```bash
sudo nano /etc/nginx/sites-available/products4thepeople
```

Paste this:

```nginx
server {
    listen 80;
    server_name products4thepeople.com www.products4thepeople.com;

    root /var/www/products4thepeople/dist;
    index index.html;

    client_max_body_size 20m;

    location /api/ {
        proxy_pass http://127.0.0.1:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location = /mock-checkout {
        proxy_pass http://127.0.0.1:4000/mock-checkout;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location = /sitemap.xml {
        proxy_pass http://127.0.0.1:4000/sitemap.xml;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/products4thepeople /etc/nginx/sites-enabled/products4thepeople
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Test:

```bash
curl -I http://products4thepeople.com
curl http://products4thepeople.com/api/health
```

---

## 13. Enable HTTPS With Certbot

Install Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Request SSL:

```bash
sudo certbot --nginx -d products4thepeople.com -d www.products4thepeople.com
```

Choose the redirect-to-HTTPS option when prompted.

Test renewal:

```bash
sudo certbot renew --dry-run
```

Final checks:

```bash
curl -I https://products4thepeople.com
curl https://products4thepeople.com/api/health
```

---

## 14. Add Stripe

In Stripe Dashboard:

1. Go to Developers > API keys.
2. Copy the live secret key beginning with `sk_live_`.
3. On the VPS:

```bash
cd /var/www/products4thepeople
nano .env
```

Set:

```env
STRIPE_SECRET_KEY=sk_live_YOUR_KEY
```

Restart the API:

```bash
pm2 restart p4tp-api
pm2 logs p4tp-api
```

Test by adding a product to cart and starting checkout.

Notes:

- Use test mode first if you are not ready for live payments.
- The app uses a Stripe checkout session flow. If the server cannot find `STRIPE_SECRET_KEY`, it falls back to the simulator.

---

## 15. Add Google Login

In Google Cloud Console:

1. Create/select a project.
2. Configure OAuth consent screen.
3. Create OAuth Client ID.
4. Choose Web application.
5. Add Authorized JavaScript origins:

```text
https://products4thepeople.com
https://www.products4thepeople.com
```

6. Copy the Client ID.

On the VPS:

```bash
cd /var/www/products4thepeople
nano .env
```

Set:

```env
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
```

Because this is a `VITE_*` variable, rebuild and reload:

```bash
npm run build
pm2 restart p4tp-api
sudo systemctl reload nginx
```

Test by opening the storefront and using Sign In.

---

## 16. Add AI

Create an OpenAI API key, then on the VPS:

```bash
cd /var/www/products4thepeople
nano .env
```

Set:

```env
OPENAI_API_KEY=sk-YOUR_KEY
```

Restart the API:

```bash
pm2 restart p4tp-api
```

Then test AI/admin generators from the Admin panel.

---

## 17. Add Analytics

Edit `.env`:

```bash
cd /var/www/products4thepeople
nano .env
```

Set any IDs you use:

```env
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_META_PIXEL_ID=1234567890
VITE_TIKTOK_PIXEL_ID=XXXXXXXXXX
```

Rebuild because these are `VITE_*` variables:

```bash
npm run build
sudo systemctl reload nginx
```

---

## 18. Optional: Add Medusa

Skip this until the main store works unless you already have a Medusa backend.

Edit `.env`:

```env
MEDUSA_BACKEND_URL=https://your-medusa-backend.com
MEDUSA_ADMIN_API_KEY=YOUR_MEDUSA_ADMIN_KEY
VITE_MEDUSA_BACKEND_URL=https://your-medusa-backend.com
VITE_MEDUSA_ADMIN_API_KEY=YOUR_MEDUSA_ADMIN_KEY
```

Rebuild and restart:

```bash
npm run build
pm2 restart p4tp-api
sudo systemctl reload nginx
```

---

## 19. Use The Admin Settings Setup Hub

After the app is live:

1. Go to `https://products4thepeople.com/#admin`.
2. Log in with `VITE_ADMIN_EMAIL` and `VITE_ADMIN_PASSWORD`.
3. Open Settings.
4. Confirm readiness cards for:
   - Database
   - Stripe
   - Google Login
   - AI Tools
   - Medusa
   - Analytics

You can update many keys from Admin Settings, but remember:

- API-only values require `pm2 restart p4tp-api`.
- `VITE_*` values require `npm run build` and Nginx reload.
- If you change `DATABASE_URL`, restart the API.

---

## 20. Deploy Updates Later

When new code is pushed to GitHub:

```bash
cd /var/www/products4thepeople
git pull origin main
npm install
npm run build
pm2 restart p4tp-api
sudo systemctl reload nginx
```

Check:

```bash
pm2 status
curl https://products4thepeople.com/api/health
curl -I https://products4thepeople.com
```

---

## 21. Backup Basics

For local PostgreSQL:

```bash
mkdir -p ~/p4tp-backups
pg_dump "postgres://p4tp_app:CHANGE_THIS_TO_A_LONG_PASSWORD@localhost:5432/products4thepeople" > ~/p4tp-backups/products4thepeople-$(date +%F).sql
```

Restore:

```bash
psql "postgres://p4tp_app:CHANGE_THIS_TO_A_LONG_PASSWORD@localhost:5432/products4thepeople" < ~/p4tp-backups/products4thepeople-YYYY-MM-DD.sql
```

For IONOS managed PostgreSQL, use IONOS backup/export tooling where available.

---

## 22. Troubleshooting

### API says local file fallback instead of PostgreSQL

Check `.env`:

```bash
grep DATABASE_URL .env
pm2 logs p4tp-api
```

Test DB:

```bash
psql "$DATABASE_URL"
```

If `psql "$DATABASE_URL"` fails, the API will fail too.

### Site loads but API fails

Check:

```bash
pm2 status
pm2 logs p4tp-api
curl http://localhost:4000/api/health
curl https://products4thepeople.com/api/health
sudo nginx -t
sudo systemctl status nginx
```

### Checkout uses simulator

Check:

```bash
grep STRIPE_SECRET_KEY .env
pm2 restart p4tp-api
pm2 logs p4tp-api
```

### Google Login still shows simulator

You changed a `VITE_*` variable. Rebuild:

```bash
npm run build
sudo systemctl reload nginx
```

Also confirm the domain is in Google OAuth Authorized JavaScript origins.

### Nginx 502 Bad Gateway

Usually the API is not running:

```bash
pm2 status
pm2 restart p4tp-api
curl http://localhost:4000/api/health
```

### HTTPS certificate fails

Check DNS first:

```bash
nslookup products4thepeople.com
nslookup www.products4thepeople.com
```

Both must point to the VPS IP before Certbot can issue certificates.

---

## 23. Production Go-Live Checklist

- [ ] DNS points to VPS IP.
- [ ] Ports `22`, `80`, `443` are open in IONOS and Ubuntu firewall.
- [ ] `npm run build` succeeds.
- [ ] PM2 shows `p4tp-api` online.
- [ ] `https://products4thepeople.com` loads.
- [ ] `https://products4thepeople.com/api/health` returns JSON.
- [ ] PostgreSQL is connected, not local fallback.
- [ ] Admin email/password changed from defaults.
- [ ] Stripe live key added and checkout tested.
- [ ] Google Client ID added and login tested.
- [ ] AI key added and generators tested.
- [ ] Analytics IDs added and verified.
- [ ] Backup plan created.

