# Production Deployment Guide: Medusa Backend on Plesk VPS

This guide outlines the step-by-step configuration required to deploy the Medusa backend ("Madusa") on your live Plesk VPS (`70.35.207.102`) and connect it securely to your storefront (`products4thepeople.com` and all subdomains).

Since your server utilizes **Plesk** for hosting management and **PM2** for running Node processes, we will leverage these tools to construct a highly reliable, SSL-secured environment.

---

## Architecture Diagram

```mermaid
graph TD
    User([Browser Client]) -->|HTTPS: products4thepeople.com| Nginx[Nginx Reverse Proxy]
    User -->|HTTPS: *.products4thepeople.com| Nginx
    User -->|HTTPS: medusa.products4thepeople.com| Nginx
    
    subgraph VPS (70.35.207.102)
        Nginx -->|Proxy to Port 4000| Express[Express Storefront API]
        Nginx -->|Proxy to Port 9000| Medusa[Medusa Backend]
        Medusa -->|Port 5432| Postgres[(PostgreSQL DB)]
    end
```

---

## 1. DNS & Plesk Subdomain Configuration

To route API traffic for the Medusa backend separate from the storefront, you need to create a dedicated subdomain (e.g., `medusa.products4thepeople.com`).

1. **DNS Settings (IONOS / Registrar)**:
   - Ensure you have an **A Record** pointing to your VPS IP:
     - Host: `medusa`
     - Points to: `70.35.207.102`
   - *Note: Ensure your wildcard A record `*` is also pointing to `70.35.207.102` so dynamic storefront subdomains (e.g., `glowtheory.products4thepeople.com`) route correctly to the storefront.*

2. **Add Subdomain in Plesk**:
   - Log into your Plesk Panel.
   - Click **Add Subdomain**.
   - Subdomain name: `medusa`
   - Parent domain: `products4thepeople.com`
   - Document root: You can set this to `subdomains/medusa/public` (it doesn't matter much as we will bypass static files and proxy all requests to PM2).

3. **Install Let's Encrypt SSL Certificate**:
   - In Plesk, navigate to the newly created `medusa.products4thepeople.com` dashboard.
   - Click **SSL/TLS Certificates**.
   - Click **Get it free** under Let's Encrypt.
   - Secure the domain. Make sure to check the box for securing the `www.medusa` variant if needed, then click **Install**.

---

## 2. PostgreSQL Database Setup in Plesk

Medusa requires a PostgreSQL database to run in production.

1. **Verify / Add Postgres in Plesk**:
   - In Plesk, go to **Tools & Settings** -> **Database Servers**.
   - Ensure **PostgreSQL** is listed and running.
     - *If it is missing, you can install it via the Plesk Installer (Updates & Upgrades -> Add/Remove Components -> PostgreSQL server).*
2. **Create the Database**:
   - Go to your domain `products4thepeople.com` (or the subscriptions page) and click **Databases**.
   - Click **Add Database**.
   - **Database server**: Select `PostgreSQL` from the dropdown.
   - **Database name**: `p4tp_medusa`
   - **Database user**: `medusa_user`
   - **Password**: Create a secure password (e.g., `SuperSecurePassword123!`).
   - Click **OK**.
3. **Connection String**:
   - Your database connection string will look like:
     ```text
     postgresql://medusa_user:SuperSecurePassword123!@127.0.0.1:5432/p4tp_medusa
     ```

---

## 3. Deploying and Configuring Medusa on the VPS

Now, SSH into your VPS (`70.35.207.102`) to set up the Medusa files.

1. **SSH into the Server**:
   ```bash
   ssh root@70.35.207.102
   ```

2. **Create the App Folder**:
   Create a directory for your Medusa installation, for example:
   ```bash
   mkdir -p /var/www/p4tp-medusa
   cd /var/www/p4tp-medusa
   ```

3. **Scaffold / Clone your Medusa project**:
   If you have a local Medusa configuration push it to a git repo and clone it. Alternatively, initialize a fresh Medusa project:
   ```bash
   npx create-medusa-app@latest --directory-path ./ --use-npm --no-browser
   ```

4. **Configure CORS and Project Settings in `medusa-config.js`**:
   Open the `medusa-config.js` file. You need to configure the CORS variables to allow requests from your live storefront domain and any storefront subdomains:
   ```javascript
   // Ensure the CORS configuration allows wildcard subdomains and the main domain
   const STORE_CORS = process.env.STORE_CORS || "https://products4thepeople.com,https://*.products4thepeople.com";
   const ADMIN_CORS = process.env.ADMIN_CORS || "https://medusa.products4thepeople.com";

   module.exports = {
     projectConfig: {
       database_url: DATABASE_URL,
       database_type: "postgres",
       store_cors: STORE_CORS,
       admin_cors: ADMIN_CORS,
       // ... other configs
     }
   };
   ```

5. **Set Environment Variables (`.env`)**:
   Create a `.env` file in the root of `/var/www/p4tp-medusa`:
   ```env
   PORT=9000
   JWT_SECRET=super_secret_jwt_key_change_me
   COOKIE_SECRET=super_secret_cookie_key_change_me
   DATABASE_URL=postgresql://medusa_user:SuperSecurePassword123!@127.0.0.1:5432/p4tp_medusa
   STORE_CORS=https://products4thepeople.com,https://*.products4thepeople.com,http://localhost:5173
   ADMIN_CORS=https://medusa.products4thepeople.com,http://localhost:7001
   ```

6. **Run Database Migrations**:
   Run the Medusa migrations to set up database schemas:
   ```bash
   npx medusa migrations run
   ```

7. **Create an Admin User**:
   Create an admin account so you can log in to the Medusa Dashboard:
   ```bash
   npx medusa user --email admin@products4thepeople.com --password YourAdminPasswordHere
   ```

---

## 4. Setting up PM2 Process Manager for Medusa

To ensure Medusa runs continuously and restarts automatically on failures:

1. **Start Medusa via PM2**:
   From your Medusa application directory (`/var/www/p4tp-medusa`), run:
   ```bash
   pm2 start npx --name "products-medusa" -- medusa start
   ```

2. **Save PM2 configuration**:
   Ensure the process starts up on system reboot:
   ```bash
   pm2 save
   ```

3. **Verify running status**:
   ```bash
   pm2 status
   ```
   You should see `products-medusa` listed as online on port `9000`.

---

## 5. Nginx Reverse Proxy Setup in Plesk

To forward public traffic from `https://medusa.products4thepeople.com` to the internal Medusa process running at port `9000`:

1. In Plesk, go to **Domains** -> `medusa.products4thepeople.com` -> **Apache & Nginx Settings**.
2. Scroll down to **Nginx settings**:
   - **Proxy mode**: **Uncheck** this box (disabling it forces Nginx to respond directly, skipping Apache, which is much faster and cleaner for Node apps).
   - **Smart static files processing**: **Uncheck** this box.
3. In the **Additional nginx directives** text area, input the following proxy rules:
   ```nginx
   location / {
       proxy_pass http://127.0.0.1:9000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       
       # Handle pre-flight CORS requests
       if ($request_method = 'OPTIONS') {
           add_header 'Access-Control-Allow-Origin' '$http_origin' always;
           add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE, PATCH' always;
           add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,x-publishable-key' always;
           add_header 'Access-Control-Allow-Credentials' 'true' always;
           add_header 'Access-Control-Max-Age' 1728000;
           add_header 'Content-Type' 'text/plain; charset=utf-8';
           add_header 'Content-Length' 0;
           return 204;
       }
   }
   ```
4. Click **OK** to apply settings. Nginx will reload automatically.
5. **Verify Routing**:
   Open a browser or run a curl command to check health:
   ```bash
   curl -I https://medusa.products4thepeople.com/health
   ```
   It should return a `200 OK` status.

---

## 6. Connecting the Storefront Platform to Medusa

With Medusa online, you now link the Storefront Platform Express server and frontend React client.

1. **Generate Admin API Key**:
   - Log into your Medusa Admin Dashboard at `https://medusa.products4thepeople.com/app` (or access the dashboard setup).
   - Go to **Settings** -> **User Settings** -> Click on your User -> Click **Generate API Key**.
   - Copy the generated API Key.

2. **Configure Storefront Settings**:
   - Log into your Storefront Admin Panel at `https://products4thepeople.com/#settings`.
   - Scroll to **Medusa Integration Settings**:
     - **Medusa Backend URL**: Enter `https://medusa.products4thepeople.com`
     - **Medusa Admin API Key**: Paste the API key generated in the previous step.
   - Click **Save Configurations**.
     - *This updates the storefront's server `.env` file dynamically and reloads the variables.*

3. **Verify Storefront-to-Medusa Connection**:
   - In the Storefront Admin panel, navigate to the **Products** or **Integration** dashboard.
   - Click **Verify Connection** or check the Medusa Status.
   - If connected, you will see "Medusa Status: Online".
   - You can now click **Sync Products** to pull catalog items from Medusa, or test the sync pipeline.

---

## Troubleshooting & Best Practices

### CORS Failures
If you see console errors in the browser saying *Cross-Origin Request Blocked*:
1. Double-check your Medusa `.env` file. Ensure `STORE_CORS` has `https://products4thepeople.com` and `https://*.products4thepeople.com` (no trailing slash!).
2. Ensure you restarted Medusa via PM2 after editing `.env`: `pm2 restart products-medusa`.

### Mixed Content Blockers
If your storefront is `https://` but you input `http://medusa.products4thepeople.com` as the URL, the browser will block the requests.
- **Fix**: Make sure you have secured the Medusa subdomain with SSL and use `https://medusa.products4thepeople.com` everywhere.

### Sync Failures / 502 Bad Gateway
If the Storefront reports "Medusa offline" even though the domain is reachable:
- Check if your Plesk Nginx directives are correct.
- SSH into the server and run `pm2 logs products-medusa` to view errors in real-time.
