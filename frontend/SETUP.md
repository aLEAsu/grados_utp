# Frontend Setup Guide

This document provides instructions for setting up and running the Plataforma de Grados Frontend.

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+ or yarn 3+
- Angular CLI 17+

## Initial Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Configuration

Create `.env` file in the root directory:

```env
# Development
API_URL=http://localhost:3000/api/v1
GOOGLE_CLIENT_ID=your_google_client_id_here
```

For production, use `.env.production`:

```env
API_URL=https://api.plataforma-grados-utp.com/api/v1
GOOGLE_CLIENT_ID=your_production_google_client_id
```

### 3. Update Assets

Place the following in the `src/assets/` directory:
- `favicon.ico` - Application favicon
- `images/` - Logo and other image assets

### 4. Configure PrimeNG Theme

The application is configured to use the Lara Light Blue theme. To change:

1. Update `src/main.ts` with a different theme preset
2. Available themes in PrimeNG: lara-light-blue, lara-dark-blue, bootstrap, material, etc.

## Development Server

Start the development server:

```bash
npm start
```

Navigate to `http://localhost:4200/` in your browser. The application will automatically reload if you change source files.

## Build Commands

### Development Build

```bash
npm run build
```

Output: `dist/plataforma-grados-utp/`

### Production Build

```bash
npm run build:prod
```

Optimized build with minification and tree-shaking.

### Watch Mode

```bash
npm run watch
```

Continuously rebuilds on file changes (useful for testing).

## Testing

### Run Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm test -- --code-coverage
```

## Code Quality

### Linting

```bash
npm run lint
```

### Format Code

```bash
npx prettier --write src/
```

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/                 # Core services, guards, interceptors
│   │   ├── shared/               # Shared components
│   │   ├── features/             # Feature modules
│   │   ├── app.component.*
│   │   └── app.routes.ts
│   ├── assets/                   # Static assets
│   ├── environments/             # Environment-specific configs
│   ├── styles.css               # Global styles
│   ├── index.html               # Entry HTML
│   └── main.ts                  # Bootstrap file
├── angular.json                  # Angular CLI config
├── tailwind.config.js           # Tailwind configuration
├── tsconfig.json                # TypeScript config
├── package.json                 # Dependencies
└── README.md                    # Documentation
```

## Key Features Implemented

### 1. Standalone Components (Angular 17+)
All components use standalone mode for better tree-shaking and modularity.

### 2. Auth Interceptor
Automatically injects JWT tokens in HTTP requests:
- Reads token from localStorage
- Adds Authorization header
- Handles token refresh logic

### 3. Routing with Lazy Loading
- Feature modules lazy-loaded
- Dashboard and Auth routes implemented
- Wildcard route for 404 handling

### 4. Tailwind CSS Styling
- Custom color palette for university theme
- Status badge styles
- Responsive design
- Dark mode support

### 5. PrimeNG Integration
- Professional UI components
- Lara Light Blue theme
- Custom styling for consistency

## Color Scheme

### Primary Colors
- Primary: #1e40af (Blue 800)
- Secondary: #059669 (Emerald 600)
- Accent: #d97706 (Amber 600)

### Status Colors
- Por Cargar: Gray (#9ca3af)
- Pendiente: Yellow (#fbbf24)
- En Revisión: Blue (#3b82f6)
- En Corrección: Orange (#f97316)
- Aprobado: Green (#22c55e)
- Finalizado: Emerald (#10b981)

## Deployment

### 1. Build for Production

```bash
npm run build:prod
```

### 2. Deploy to Server

Copy the `dist/plataforma-grados-utp/` directory contents to your web server.

### 3. Configure Web Server

Ensure your web server (Nginx, Apache, etc.) routes all requests to `index.html` for proper Angular routing.

#### Nginx Example

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

#### Apache Example

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## Troubleshooting

### Port Already in Use

If port 4200 is already in use:

```bash
ng serve --port 4300
```

### Module Not Found

Clear node_modules and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

1. Clear Angular cache:
   ```bash
   ng cache clean
   ```

2. Delete dist and out-tsc folders:
   ```bash
   rm -rf dist out-tsc
   ```

3. Rebuild:
   ```bash
   npm run build
   ```

## Environment Variables

The application respects environment-specific configurations in:
- `src/environments/environment.ts` (development)
- `src/environments/environment.prod.ts` (production)

### Available Environment Properties

```typescript
export const environment = {
  production: boolean,      // Is production build
  apiUrl: string,          // Backend API base URL
  googleClientId: string,  // Google OAuth client ID
  appVersion: string,      // Application version
  logLevel: string         // Logging level: 'debug' | 'info' | 'warn' | 'error'
};
```

## Performance Optimization

1. **Code Splitting**: Angular CLI automatically splits code for lazy-loaded routes
2. **Tree Shaking**: Remove unused code from production builds
3. **Minification**: Enabled in production builds
4. **AOT Compilation**: Enabled by default
5. **Change Detection**: OnPush strategy recommended for components

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Additional Resources

- [Angular Documentation](https://angular.io/docs)
- [PrimeNG Documentation](https://primeng.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Support

For issues and questions, please contact the development team.
