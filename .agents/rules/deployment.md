# Production Deployment Rules for Admin Dashboard

## CRITICAL: Admin Dashboard Build & Deploy Standard

1. **NEVER manually copy or move files between `admin_v2` and `admin` on the server or locally.**
   - Copying legacy or staging files into the production `admin/` directory breaks the React Router (`base: '/admin/'`), causing the dashboard to fail and render a blank blue screen.

2. **The ONLY correct way to deploy React Admin changes to Production:**
   - Navigate to `admin_react/` directory.
   - Run the production build command:
     ```bash
     npm run build:production
     ```
   - Upload ONLY the resulting contents of `admin_react/dist/` to the server production directory:
     ```
     /var/www/absher/backend_php/admin/
     ```
