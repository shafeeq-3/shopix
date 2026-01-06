# Vercel Deployment Guide - SHOPIX Backend

## ✅ Changes Made for Vercel Compatibility

### 1. Server.js Modified
- Added `module.exports = app` for serverless export
- Made `app.listen()` conditional (only runs in development)
- Added mongoose import for health check
- Updated health endpoint to show database status

### 2. Database Connection Optimized
- Added connection caching for serverless
- Prevents multiple connections in serverless functions
- Better error handling for production environment

### 3. Vercel.json Updated
- Added specific routes for API, uploads, health
- Added function timeout configuration (30 seconds)
- Proper routing for all endpoints

---

## 🚀 Deployment Steps

### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "Fixed Vercel serverless compatibility"
git push origin main
```

### Step 2: Deploy on Vercel

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Import Project**: Click "Add New" → "Project"
3. **Select Repository**: Choose `shafeeq-3/shopix`
4. **Configure Project**:
   - Framework Preset: Other
   - Root Directory: `backend`
   - Build Command: (leave empty)
   - Output Directory: (leave empty)

### Step 3: Add Environment Variables

Click "Environment Variables" and add these:

```
MONGO_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/ecommerce?retryWrites=true&w=majority
JWT_SECRET=your-jwt-secret-key-here
SESSION_SECRET=your-session-secret-here
STRIPE_SECRET_KEY=your-stripe-secret-key
EMAIL_USER=frostedveil0@gmail.com
EMAIL_PASS=dgxs xofa uyss or
SMTP_EMAIL=frostedveil0@gmail.com
SMTP_PASSWORD=dgxs xofa uyss or
SUPPORT_EMAIL=frostedveil0@gmail.com
FRONTEND_URL=https://your-frontend-url.vercel.app
PRODUCTION_FRONTEND_URL=https://your-frontend-url.vercel.app
NODE_ENV=production
```

**IMPORTANT**: 
- Copy exact values from your `backend/.env` file
- Don't forget to update FRONTEND_URL after deploying frontend

### Step 4: Deploy

1. Click "Deploy"
2. Wait for deployment to complete (2-3 minutes)
3. You'll get a URL like: `https://shopix-backend.vercel.app`

### Step 5: Test Backend

Test these endpoints:

1. **Health Check**: 
   ```
   https://your-backend-url.vercel.app/
   ```
   Should return: `{ status: 'OK', message: 'Server is healthy and running' }`

2. **Database Health**:
   ```
   https://your-backend-url.vercel.app/health
   ```
   Should return: `{ status: 'OK', database: 'connected' }`

3. **API Test**:
   ```
   https://your-backend-url.vercel.app/api/products
   ```
   Should return products list

---

## 🔧 MongoDB Atlas Configuration

### IMPORTANT: Update Network Access

1. Go to MongoDB Atlas Dashboard
2. Click "Network Access" (left sidebar)
3. Click "Add IP Address"
4. Select "Allow Access from Anywhere" (0.0.0.0/0)
5. Click "Confirm"

**Why?** Vercel serverless functions use dynamic IPs, so you need to allow all IPs.

### Security Note:
- This is safe because your database still requires username/password
- Only authenticated requests can access data
- MongoDB Atlas has built-in security features

---

## 📱 Frontend Deployment

After backend is deployed:

### Step 1: Update Frontend Environment Variables

In `frontend/.env`:
```
REACT_APP_API_URL=https://your-backend-url.vercel.app
```

### Step 2: Deploy Frontend on Vercel

1. Go to Vercel Dashboard
2. Click "Add New" → "Project"
3. Select `shafeeq-3/shopix` repository
4. Configure:
   - Framework Preset: Create React App
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`

5. Add Environment Variable:
   ```
   REACT_APP_API_URL=https://your-backend-url.vercel.app
   ```

6. Click "Deploy"

### Step 3: Update Backend CORS

After frontend is deployed, update backend environment variables on Vercel:

1. Go to backend project settings
2. Update these variables:
   ```
   FRONTEND_URL=https://your-frontend-url.vercel.app
   PRODUCTION_FRONTEND_URL=https://your-frontend-url.vercel.app
   ```
3. Redeploy backend (Vercel will auto-redeploy)

---

## ✅ Verification Checklist

- [ ] Backend deployed successfully
- [ ] Health endpoint returns OK
- [ ] Database shows "connected" in health check
- [ ] API endpoints working (test /api/products)
- [ ] MongoDB Network Access allows 0.0.0.0/0
- [ ] Frontend deployed successfully
- [ ] Frontend can fetch data from backend
- [ ] CORS working (no errors in browser console)
- [ ] Login/Register working
- [ ] Products displaying correctly
- [ ] Cart functionality working
- [ ] Currency selector working

---

## 🐛 Troubleshooting

### Error: FUNCTION_INVOCATION_FAILED
**Solution**: Already fixed! This was because `app.listen()` was running in production. Now it only runs in development.

### Error: Database connection timeout
**Solutions**:
1. Check MongoDB Atlas is not paused (free tier auto-pauses)
2. Verify Network Access allows 0.0.0.0/0
3. Check MONGO_URI is correct in Vercel environment variables
4. Wait 2-3 minutes after adding IP to Network Access

### Error: CORS blocked
**Solutions**:
1. Verify FRONTEND_URL is set correctly in backend
2. Check frontend is using correct REACT_APP_API_URL
3. Redeploy backend after updating CORS settings

### Error: 404 on API routes
**Solutions**:
1. Check vercel.json routes configuration
2. Verify API routes are defined in server.js
3. Check Vercel logs for errors

---

## 📊 Monitoring

### View Logs on Vercel:
1. Go to your project on Vercel
2. Click "Deployments"
3. Click on latest deployment
4. Click "Functions" tab
5. Click on any function to see logs

### Check Database:
1. MongoDB Atlas Dashboard
2. Click "Metrics" to see connection activity
3. Check "Database Access" for user permissions

---

## 🎉 Success!

Your SHOPIX e-commerce store is now live on Vercel!

**Backend URL**: https://your-backend-url.vercel.app
**Frontend URL**: https://your-frontend-url.vercel.app

Share your live store with the world! 🚀
