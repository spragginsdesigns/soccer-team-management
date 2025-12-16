# FormUp - Setup Guide

## 🚀 Quick Start

Your app has been converted to a Next.js + Convex web application! Here's what you need to do next:

### 1. Verify Convex is Running

Check that Convex is syncing your functions. You should see:
```
✔ Convex functions ready!
```

If not running, start it:
```bash
npx convex dev
```

### 2. Start the Development Server

In a **new terminal window**, run:
```bash
pnpm dev
```

Your app will be available at: **http://localhost:3000**

### 3. Test the App

- Open http://localhost:3000
- Add your team name and evaluator name
- Click "Add Player" to add players
- Click "Assess" on any player to create an assessment
- All data automatically saves to Convex (no localStorage!)

## 📦 What Changed

### Before (Single HTML File)
- ✅ Client-side only
- ✅ localStorage (data lost if cleared)
- ❌ No multi-device sync
- ❌ No sharing between coaches

### After (Next.js + Convex)
- ✅ Full-stack web app
- ✅ Cloud database (Convex)
- ✅ Real-time sync across devices
- ✅ Ready for multi-user
- ✅ Mobile-friendly
- ✅ Deployable to Vercel

## 🗄️ Database Structure

Your Convex database has 3 tables:

### `teams`
- Team name
- Evaluator/coach name
- Timestamps

### `players`
- Linked to team
- Name, age, position
- Auto-populated with assessments

### `assessments`
- Linked to player and team
- Date, evaluator
- Ratings (1-5 for each skill)
- Notes for each skill
- Overall rating (calculated average)

## 🌐 Deploy to Production

### Step 1: Push to GitHub

Initialize git if you haven't already:
```bash
git init
git add .
git commit -m "feat: convert soccer team app to Next.js + Convex"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings
5. Click "Deploy"

**That's it!** Convex automatically deploys with your Vercel deployment.

### Step 3: Set Up Production Convex

When you deploy to Vercel, Convex will automatically:
- Create a production deployment
- Set environment variables
- Sync your functions

You can view your deployments at: https://dashboard.convex.dev

## 📱 Mobile Access

After deploying to Vercel, you'll get a URL like:
```
https://soccer-team-management-xxx.vercel.app
```

Share this with coaches - they can:
- Access on any device (phone, tablet, computer)
- Add assessments from the field
- Data syncs automatically across all devices

## 🔐 Future: Add Authentication

Want to add user accounts? Convex has built-in auth:

```bash
pnpm add @convex-dev/auth
```

Follow the guide: https://labs.convex.dev/auth

This allows:
- Each coach has their own account
- Multiple teams per coach
- Secure data isolation
- Share teams with assistant coaches

## 🎯 Next Steps for Your Friend

1. **Test locally first**: Make sure everything works on localhost:3000
2. **Create GitHub account** if they don't have one
3. **Push code to GitHub**: This enables version control
4. **Deploy to Vercel**: Free tier is perfect for this app
5. **Share the URL**: All coaches can access from their phones

## 💡 Tips

### Data Migration from Old HTML File

If you have existing data in the localStorage version:

1. Open the old HTML file in browser
2. Click "Export" button
3. In new app, you can manually add players/assessments
4. (We can build an import feature if needed!)

### Customize the App

- **Colors**: Edit `tailwind.config.ts` to change the green theme
- **Skills**: Edit `categories` array in assessment page
- **Team Logo**: Add an image to the header
- **Print Styles**: Already included for printing assessments

### Monitoring

- **Convex Dashboard**: https://dashboard.convex.dev
  - View all your data
  - See function logs
  - Monitor usage (free tier is generous)

- **Vercel Dashboard**: https://vercel.com/dashboard
  - See deployments
  - View analytics
  - Check performance

## 🐛 Troubleshooting

### "Cannot find module 'convex'"
```bash
pnpm install
```

### Convex not syncing
```bash
npx convex dev
```

### TypeScript errors
```bash
pnpm build
```
Fix any errors shown

### App not loading
1. Check both terminals are running (`pnpm dev` and `npx convex dev`)
2. Check browser console for errors
3. Verify .env.local has `NEXT_PUBLIC_CONVEX_URL`

## 📞 Need Help?

- Convex Docs: https://docs.convex.dev
- Next.js Docs: https://nextjs.org/docs
- Vercel Docs: https://vercel.com/docs
- Convex Discord: https://convex.dev/community

## 🎉 You're Done!

Your soccer team management app is now a production-ready web application that can be accessed from anywhere, on any device!
