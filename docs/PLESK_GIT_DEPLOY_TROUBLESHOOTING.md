# Plesk Git Deployment Troubleshooting Guide

This guide documents the working Plesk/Git/Apache/nginx setup for Products4ThePeople.
Use it when the Git plugin says deployment worked but the live site still shows an old
version.

## Current Production Model

The custom domain is served by the IONOS/Plesk server:

```text
products4thepeople.com -> 70.35.207.102
```

The live public document root is:

```text
/var/www/vhosts/products4thepeople.com/httpdocs
```

The Node API runs locally on the server:

```text
http://127.0.0.1:4000
```

The PM2 process name is:

```text
p4tp-api
```

The frontend is a Vite app. Plesk deploys the repo into `/httpdocs`, then `npm run build`
creates:

```text
/var/www/vhosts/products4thepeople.com/httpdocs/dist
```

The browser does not serve `dist` directly in this setup. The deploy action must copy
`dist` back into `/httpdocs`.

## Plesk Git Plugin Fields

Use these values in **Plesk > Domains > products4thepeople.com > Git**.

```text
Repository name:
Products4thePeople.git

Repository URL:
https://github.com/thescoobmeisterm/Products4thePeople.git

Username:
thescoobmeisterm

Password:
GitHub personal access token

Repository branch:
main

Deployment mode:
Automatic

Server path:
/httpdocs
```

If the GitHub repo is private, the password must be a GitHub personal access token with
repository read access. A normal GitHub account password will not work.

## GitHub Webhook

In GitHub, go to:

```text
Repository > Settings > Webhooks
```

Use the Plesk webhook URL shown in the Plesk Git panel:

```text
Payload URL:
https://wonderful-robinson.70-35-207-102.plesk.page:8443/modules/git/public/web-hook.php?uuid=8431691d-4f2d-c357-5046-959d2620af1d

Content type:
application/json

Secret:
leave blank unless Plesk provides one

SSL verification:
Enable SSL verification

Events:
Just the push event

Active:
Checked
```

After changing repo privacy, token, or webhook settings, redeliver the most recent webhook
or push a new commit.

## Plesk Deploy Actions

Use this in **Deploy actions**:

```bash
npm install
npm run build
rm -rf assets
cp -a dist/. .
```

Do not include `git fetch` or `git reset` in Plesk deploy actions. Plesk runs the Git
checkout before deploy actions. In some Plesk modes, deploy actions do not run inside a
real `.git` working tree, which causes:

```text
fatal: not a git repository
```

Do not include `pm2 restart` until the frontend deployment is proven working. PM2 only
affects the API, not the static frontend.

## Apache And nginx Settings

Use these Plesk settings:

```text
Proxy mode:
On

Smart static files processing:
Off

Serve static files directly by nginx:
On
```

Smart static files processing should stay off because it can cause stale asset behavior.

## Additional nginx Directives

In **Plesk > Domains > products4thepeople.com > Apache & nginx Settings > Additional nginx
directives**, include these directives:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:4000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location = /health {
    proxy_pass http://127.0.0.1:4000/health;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /uploads/ {
    proxy_pass http://127.0.0.1:4000/uploads/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Keep existing Medusa proxy directives if Medusa is still used.

## After Changing Plesk Settings

Run this over SSH as `root`:

```bash
plesk repair web products4thepeople.com -y
systemctl reload nginx
systemctl reload apache2 2>/dev/null || systemctl reload httpd
```

## One-Time Permission Repair

If Plesk deploy fails with `EACCES`, `permission denied`, or `unable to unlink old`, run:

```bash
ssh root@70.35.207.102

chown -R products4thepeople.c_4ix2g6d2jzv:psacln /var/www/vhosts/products4thepeople.com/httpdocs
chmod -R u+rwX /var/www/vhosts/products4thepeople.com/httpdocs

mkdir -p /var/www/vhosts/products4thepeople.com/.npm
chown -R products4thepeople.c_4ix2g6d2jzv:psacln /var/www/vhosts/products4thepeople.com/.npm
chmod -R u+rwX /var/www/vhosts/products4thepeople.com/.npm
```

If `node_modules` is broken or root-owned, remove it:

```bash
rm -rf /var/www/vhosts/products4thepeople.com/httpdocs/node_modules
```

If Vite fails while copying files into `dist`, such as:

```text
EACCES: permission denied, copyfile 'public/Logos/DriveCraft_Logo.png' -> 'dist/Logos/DriveCraft_Logo.png'
```

remove the root-owned build output and fix ownership:

```bash
rm -rf /var/www/vhosts/products4thepeople.com/httpdocs/dist
chown -R products4thepeople.c_4ix2g6d2jzv:psacln /var/www/vhosts/products4thepeople.com/httpdocs
chmod -R u+rwX /var/www/vhosts/products4thepeople.com/httpdocs
```

Then deploy again from Plesk.

## PM2 API Commands

Check the API:

```bash
pm2 status
pm2 logs p4tp-api
curl http://127.0.0.1:4000/health
```

Restart the API manually as root:

```bash
pm2 restart p4tp-api
pm2 save
```

Do not use `products-platform`; the correct PM2 process name is `p4tp-api`.

## Verify A Successful Frontend Deploy

After using the Plesk Git deploy button, run:

```bash
cd /var/www/vhosts/products4thepeople.com/httpdocs

echo "Source version:"
grep "APP_VERSION" src/lib/version.ts

echo "Live asset referenced by index.html:"
grep -o 'assets/[^"]*.js' index.html

echo "Version in deployed assets:"
grep -R "1.6.1" assets | head
```

Then check the public domain:

```bash
curl -s "https://products4thepeople.com/?bust=$(date +%s)" | grep -o 'assets/[^"]*.js'
curl -s "https://products4thepeople.com/assets/YOUR_ASSET_FILE.js?bust=$(date +%s)" | grep -o "1.6.1" | head
```

Replace `YOUR_ASSET_FILE.js` with the file printed by the first command.

## Verify API Proxy

Run:

```bash
curl https://products4thepeople.com/health
```

Expected result:

```json
{"ok":true,"service":"p4tp-api"}
```

If admin settings save returns an HTML 404 page, `/api/` is not being proxied to the Node
API. Recheck the Additional nginx directives.

To test the settings route:

```bash
curl -i https://products4thepeople.com/api/settings/config \
  -H "x-admin-email: YOUR_ADMIN_EMAIL" \
  -H "x-admin-password: YOUR_ADMIN_PASSWORD"
```

Expected outcomes:

```text
200 JSON = proxy and credentials work
401 JSON = proxy works, credentials are wrong
404 HTML = proxy is missing or Plesk/nginx config is wrong
```

## Common Failure Meanings

### Live Site Still Shows An Old Version

Check:

```bash
cd /var/www/vhosts/products4thepeople.com/httpdocs
grep -o 'assets/[^"]*.js' index.html
grep -R "APP_VERSION" src/lib/version.ts
grep -R "1.6.1" assets | head
```

If `src/lib/version.ts` is old, Plesk did not pull the latest GitHub commit.

If `src/lib/version.ts` is new but `assets` is old, Plesk did not run `npm run build` or
did not copy `dist` back into `/httpdocs`.

If files on disk are new but the browser is old, reload Plesk/nginx and confirm smart static
files processing is off.

### `fatal: not a git repository`

Remove `git fetch` and `git reset` from Plesk deploy actions.

### `Process or Namespace p4tp-api not found`

Plesk deploy actions are running under a different Linux user than the PM2 process. Remove
PM2 restart from deploy actions and restart manually:

```bash
pm2 restart p4tp-api
```

### `EACCES` During `npm install`

Run the one-time permission repair above. This usually happens after root creates or modifies
`node_modules`, `index.html`, or `package-lock.json`.

## Emergency Force Deploy

Use this only if Plesk deploy is broken and the live site must be updated immediately:

```bash
ssh root@70.35.207.102

cd /var/www/vhosts/products4thepeople.com
mkdir -p releases backups

rm -rf releases/p4tp-force-live
git clone https://github.com/thescoobmeisterm/Products4thePeople.git releases/p4tp-force-live

cd releases/p4tp-force-live
npm ci
npm run build

cd /var/www/vhosts/products4thepeople.com
tar -czf backups/httpdocs-before-force-$(date +%Y%m%d-%H%M%S).tar.gz httpdocs

rm -rf httpdocs/assets
cp -a releases/p4tp-force-live/dist/. httpdocs/
chown -R products4thepeople.c_4ix2g6d2jzv:psacln httpdocs/index.html httpdocs/assets

systemctl reload nginx
```

Verify:

```bash
grep -o 'assets/[^"]*.js' /var/www/vhosts/products4thepeople.com/httpdocs/index.html
grep -R "1.6.1" /var/www/vhosts/products4thepeople.com/httpdocs/assets | head
```

## Best Long-Term Cleanup

The current setup works, but it mixes source files and public files in `/httpdocs`.
The cleaner setup is:

```text
/var/www/vhosts/products4thepeople.com/app/Products4thePeople   source repo
/var/www/vhosts/products4thepeople.com/httpdocs                 built public files only
```

If you move to that setup, set Plesk Git Server path to:

```text
/app/Products4thePeople
```

and use deploy actions:

```bash
npm install
npm run build
rm -rf /var/www/vhosts/products4thepeople.com/httpdocs/assets
cp -a dist/. /var/www/vhosts/products4thepeople.com/httpdocs/
```

Do this only after the current `/httpdocs` deployment is stable.
