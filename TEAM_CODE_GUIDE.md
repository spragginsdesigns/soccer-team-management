# Team Code System Guide

## 🎯 How It Works

Your app now uses **Team Codes** to separate different teams. This allows 50+ teams to use the same deployed website without mixing their data!

## 🔑 What is a Team Code?

A team code is a unique identifier for your team (like `EAGLES2025` or `PANTHERS-U12`).

Think of it like a password, but:
- ✅ It's meant to be shared with your coaching staff
- ✅ Anyone with the code can view/edit that team's data
- ✅ Each team is completely isolated from others

## 📱 For Coaches Using The App

### First Time Setup

1. **Visit the website**
2. **Enter a team code** when prompted (e.g., `EAGLES2025`)
3. **Start adding players!**

The app will remember your team code in your browser.

### Sharing With Assistant Coaches

Option 1: **Share the Link** (Easiest!)
```
https://your-app.vercel.app/?team=EAGLES2025
```
Click "Copy Share Link" button in the app to copy this automatically.

Option 2: **Share Just the Code**
- Tell them the team code: `EAGLES2025`
- They enter it when they visit the site

### Switching Between Teams

If you coach multiple teams:
1. Click "Switch Team" in the top right
2. Enter a different team code
3. You'll see that team's players

Each team code shows completely different data!

## 🔒 Security Considerations

### What Team Codes Protect:
- ✅ **Team Separation**: Eagles can't see Panthers' data
- ✅ **Accidental Access**: Can't stumble onto another team's data
- ✅ **Privacy**: Each team's assessments are private

### What Team Codes DON'T Protect:
- ❌ **Malicious Access**: Anyone with the code can access
- ❌ **Fine-grained Permissions**: Everyone with code can edit
- ❌ **Audit Trail**: Can't see who made what changes

**Recommendation:** Only share codes with trusted coaching staff.

## 💡 Tips for Choosing Team Codes

### Good Examples:
- `EAGLES2025` (team name + year)
- `PANTHERS-U12` (team + age group)
- `REDWINGS-VARSITY` (team + level)
- `LIONS-SPRING` (team + season)

### Bad Examples:
- `TEAM` (too generic)
- `12345` (not memorable)
- `a` (too short)
- Names with spaces (they get removed)

**Pro Tip:** Use CAPS and hyphens for readability!

## 🌐 Deployment Scenarios

### Scenario 1: Public Deployment
One website serves many teams:
- Deploy to: `soccer-team-manager.vercel.app`
- Team 1 uses: `?team=EAGLES2025`
- Team 2 uses: `?team=PANTHERS2025`
- Team 3 uses: `?team=LIONS2025`

**Perfect for:** Multiple teams in a league

### Scenario 2: League-Wide Tool
Give all coaches in your league access:
- Share: `soccer-team-manager.vercel.app`
- Each team gets their own code
- League admin can track all teams (with all codes)

## 🔄 How Data Flows

```
1. User visits site
   ↓
2. Check URL for ?team=CODE
   ↓
3. If not found, check browser localStorage
   ↓
4. If not found, show team code modal
   ↓
5. User enters code (e.g., EAGLES2025)
   ↓
6. Code saved to localStorage + URL
   ↓
7. App queries database for team with that code
   ↓
8. If team doesn't exist, create it
   ↓
9. Show that team's players and assessments
```

## 📊 Example Use Cases

### Use Case 1: Head Coach + 2 Assistants
1. Head coach creates team with code `EAGLES2025`
2. Shares link: `app.com/?team=EAGLES2025`
3. All 3 coaches can add/edit players
4. All changes sync in real-time

### Use Case 2: Multiple Teams at a School
- Varsity: `PANTHERS-VARSITY`
- JV: `PANTHERS-JV`
- Freshman: `PANTHERS-FRESH`

Each team is completely separate, but uses same app!

### Use Case 3: Select Team Tryouts
1. Create team: `TRYOUTS-2025`
2. Assess 50 kids during tryouts
3. Export data to share with coaching staff
4. After selection, archive and start new season

## 🚀 Advanced: URL Parameters

The team code is stored in the URL as a query parameter:
```
https://app.com/?team=EAGLES2025
```

**Benefits:**
- Shareable links
- Bookmark specific teams
- Works across devices
- No login required

**When you click "Assess" on a player:**
```
https://app.com/assessment/abc123?team=EAGLES2025
```

The team code follows you through the app!

## 🛠️ Technical Details

### Database Structure
```
Team {
  teamCode: "EAGLES2025",  ← Unique identifier
  name: "Eagles Varsity",
  evaluator: "Coach Smith",
  ...
}

Players filtered by: teamId (linked to team)
Assessments filtered by: teamId (linked to team)
```

### What Happens When:

**Same code entered twice:**
- ✅ Both users see same team (intended!)

**Two teams pick same code:**
- ❌ Second team gets error: "Code already exists"
- They must choose different code

**User clears browser data:**
- Team code removed from localStorage
- URL still has it (if bookmarked)
- Or they re-enter the code

## 📖 For Developers

Want to add authentication later? Easy!

Just add Convex Auth and link teams to user accounts:
```typescript
Team {
  teamCode: string,
  ownerId: string,  ← User who created it
  collaborators: string[],  ← Other users with access
  ...
}
```

Then you can:
- Restrict editing to owner
- Send team invites
- Add role-based permissions
- Track who made changes

## ❓ FAQ

**Q: Can someone guess my team code?**
A: Unlikely if you use a unique code. `EAGLES2025` is easy to guess, `EAGLES-XK7P-2025` is not.

**Q: What if I forget my team code?**
A: Check your browser history or ask another coach who has the link.

**Q: Can I change my team code?**
A: Not currently. You'd need to create a new team and manually transfer data.

**Q: How many teams can use the app?**
A: Unlimited! Each team code creates a separate team in the database.

**Q: Does this work offline?**
A: No, you need internet to access the Convex database.

**Q: Can I see all teams?**
A: No, you only see teams whose codes you know. Even admins can't see all teams without codes.

## 🎉 You're All Set!

The team code system gives you:
- ✅ Multi-team support
- ✅ No login hassle
- ✅ Easy sharing
- ✅ Complete isolation
- ✅ Infinite scalability

Perfect for soccer teams! ⚽
