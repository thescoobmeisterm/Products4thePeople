# Brand Design System Checklist

- [x] Load Google Fonts in `index.html`
- [x] Add `"automotive"` to `Niche` type and extend `storefrontHashes` in `src/main.tsx`
- [x] Add DriveCraft detailing seed products in `src/main.tsx`
- [x] Update `StorefrontNicheConfig` type definition and populate `storefrontNiches` for all 6 brands
- [x] Update `getProductSubcategory` with the custom collections for all brands
- [x] Map CSS custom properties in `src/styles.css` to use the dynamic theme variables
- [x] Apply theme custom variables to the React storefront render container in `src/main.tsx`
- [x] Compile and verify build locally
- [x] Push to Git and advise deployment on remote server

## 📝 User To-dos (Tomorrow)
- [ ] **DNS Setup**: Add wildcard `A` record (`*`) pointing to `70.35.207.102` in domain provider DNS settings.
- [ ] **Plesk Setup**: Add wildcard subdomain (`*`) in Plesk web panel under `products4thepeople.com` pointing to the main website root.
- [ ] **Let's Encrypt**: Secure the wildcard domain (`*.products4thepeople.com`) inside Plesk SSL settings.
- [ ] **Deploy storefront on VPS**: SSH into VPS and run:
  ```bash
  cd /var/www/products4thepeople
  git pull origin main
  npm run build
  pm2 restart products-platform
  ```
