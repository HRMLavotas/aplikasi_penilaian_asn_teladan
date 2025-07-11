# 🚀 Panduan Deployment Produksi

## Prerequisites

1. **Environment Variables**
   - Copy `.env.example` ke `.env`
   - Isi semua variabel environment yang diperlukan:
     ```env
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     VITE_ADMIN_EMAIL=admin@yourdomain.com
     VITE_DEEPSEEK_API_KEY=your_deepseek_api_key_here
     ```

## Build Commands

### Development

```bash
npm run dev
```

### Production Build

```bash
# Install production dependencies
npm ci --only=production

# Build with production optimizations
NODE_ENV=production vite build --config vite.config.prod.ts

# Or use the provided script
bash scripts/build-prod.sh
```

## Security Checklist ✅

### ✅ Completed

- [x] Environment variables configured
- [x] Console statements removed
- [x] Error boundaries implemented
- [x] Input validation in place
- [x] Authentication flow secured
- [x] Database credentials secured

### ⚠️ Server Configuration Required

1. **Security Headers** (Configure in your web server)

   ```nginx
   # Example for Nginx
   add_header X-Frame-Options "SAMEORIGIN";
   add_header X-Content-Type-Options "nosniff";
   add_header X-XSS-Protection "1; mode=block";
   add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
   add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';";
   ```

2. **Rate Limiting**
   - Implement at reverse proxy level (Nginx, Cloudflare, etc.)
   - Recommended: 100 requests/minute per IP

3. **CORS Configuration**
   - Configure in Supabase Dashboard > Settings > API
   - Add your production domain

## Database Security

1. **Row Level Security (RLS)**
   - Already enabled on all tables
   - Policies restrict access based on authentication

2. **Backup Strategy**
   - Enable automated backups in Supabase
   - Set up point-in-time recovery

## Monitoring & Logging

### Recommended Services

- **Error Tracking**: Sentry, Bugsnag
- **Performance**: Vercel Analytics, Google Analytics
- **Uptime**: StatusCake, Pingdom

### Key Metrics to Monitor

- Authentication success/failure rates
- Database query performance
- Page load times
- Error rates

## Deployment Platforms

### Recommended Platforms

1. **Vercel** (Recommended)

   ```bash
   npm i -g vercel
   vercel --prod
   ```

2. **Netlify**

   ```bash
   npm run build
   # Upload dist/ folder
   ```

3. **AWS S3 + CloudFront**
   ```bash
   npm run build
   aws s3 sync dist/ s3://your-bucket-name
   ```

## Performance Optimizations

### ✅ Already Implemented

- Code splitting and lazy loading
- Gzip compression
- Tree shaking
- Minification
- Chunked vendor libraries

### Additional Recommendations

- Enable CDN caching (1 year for static assets)
- Use HTTP/2 server push for critical resources
- Implement service worker for offline capability

## Post-Deployment Checklist

1. **Functional Testing**
   - [ ] Login/logout functionality
   - [ ] Data entry and retrieval
   - [ ] Evaluation forms
   - [ ] Ranking calculations
   - [ ] Report generation

2. **Performance Testing**
   - [ ] Page load times < 3 seconds
   - [ ] Database queries < 1 second
   - [ ] Forms submission < 2 seconds

3. **Security Testing**
   - [ ] Authentication required for protected routes
   - [ ] SQL injection prevention
   - [ ] XSS protection
   - [ ] CSRF protection

## Troubleshooting

### Common Issues

1. **Build Fails**

   ```bash
   # Clear cache and retry
   npm run clean
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Environment Variables Not Loaded**
   - Ensure .env file is in project root
   - Check variable naming (must start with VITE\_)
   - Verify no spaces around = in .env file

3. **Database Connection Issues**
   - Verify Supabase URL and key
   - Check CORS settings in Supabase
   - Ensure RLS policies are correct

## Support

Untuk pertanyaan deployment atau masalah teknis, silakan hubungi tim development.
