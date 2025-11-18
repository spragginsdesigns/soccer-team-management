# PlayMaker

A modern web application for tracking player development and team assessments.

## Features

- 📊 Track player assessments across multiple categories
- 📈 Monitor player progress over time
- 👥 Manage team rosters
- 💾 Cloud database with Convex
- 🔄 Real-time updates
- 📱 Mobile-friendly responsive design

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: Convex
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ installed
- pnpm package manager
- Convex account (free tier available at https://convex.dev)

### Setup

1. Install dependencies:
```bash
pnpm install
```

2. Set up Convex:
   - Visit https://convex.dev and create a free account
   - Run `pnpm convex dev` and follow the prompts to create a new project
   - This will create a `.env.local` file with your Convex deployment URL

3. Run the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Visit [vercel.com](https://vercel.com) and import your repository
3. Add your Convex deployment URL as an environment variable:
   - `NEXT_PUBLIC_CONVEX_URL=<your-convex-url>`
4. Deploy!

Your Convex backend will automatically deploy when you push to production.

## Project Structure

```
soccer-team-management/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Main team roster page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── TeamRoster.tsx    # Team roster view
│   └── PlayerAssessment.tsx # Player assessment form
├── convex/               # Convex backend
│   ├── schema.ts        # Database schema
│   ├── players.ts       # Player queries & mutations
│   └── teams.ts         # Team queries & mutations
└── package.json
```

## Assessment Categories

- **Technical Skills**: Ball control, passing, dribbling, shooting, heading, weak foot
- **Tactical Understanding**: Positioning, decision making, movement, organization
- **Physical Attributes**: Speed, stamina, strength, agility, fitness
- **Mental & Psychological**: Focus, confidence, composure, teamwork, leadership

## License

MIT
