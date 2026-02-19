# ⚽ Football Fusion

**PvP Fantasy Football on Solana — Where Players Own the Game**

Football Fusion is a mobile-first fantasy football dApp where users create their own tournaments, set their own stakes, and compete for transparent on-chain prize pools that pay out **weekly or monthly** — not at the end of a 10-month season.

Built natively for Android and the [Solana dApp Store](https://solanamobile.com).

---

## 🎮 Features

- **User-Created Tournaments** — Set your own entry fee, max players, duration, and league
- **PvP Competition** — Small groups (2–64 players), not millions competing for one prize
- **Weekly/Monthly Payouts** — Earn as you play, not once a year
- **Multi-League Support** — Premier League, La Liga, Serie A (expanding)
- **On-Chain Prize Pools** — USDC staked to Solana PDAs, 97% to winners (50/30/20 split), 3% platform fee
- **Real Player Data** — Powered by live Fantasy Premier League stats
- **Mobile Wallet** — Built-in Solana wallet with seed phrase backup
- **Fiat On/Off-Ramp** — Buy USDC with card/bank, withdraw to bank via Transak
- **Blockchain Verification** — Every transaction viewable on Solana Explorer

---

## 📱 Screenshots

> *Coming soon — see the demo video for a full walkthrough*

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Mobile** | React Native + Expo (SDK 53) |
| **Blockchain** | Solana (Anchor Framework, SPL Token, USDC) |
| **Wallet** | Mobile Wallet Adapter (MWA) |
| **Backend** | Supabase (Auth, Postgres, Realtime) |
| **Player Data** | Fantasy Premier League API |
| **On/Off-Ramp** | Transak |
| **Build** | EAS Build → APK |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [EAS CLI](https://docs.expo.dev/eas/) (`npm install -g eas-cli`)
- A Supabase project with the required schema

### Installation

```bash
# Clone the repo
git clone https://github.com/foniolabs/football-fusion-mobile.git
cd football-fusion-mobile

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your Supabase URL and anon key
```

### Environment Variables

Create a `.env` file in the root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Development

```bash
# Start the dev server
npx expo start

# Start with cache cleared
npx expo start --clear
```

Scan the QR code with [Expo Go](https://expo.dev/go) on your Android device.

### Building the APK

```bash
# Login to EAS
eas login

# Build APK (preview profile)
eas build --platform android --profile preview
```

The APK will be available for download from your [Expo dashboard](https://expo.dev).

---

## ⛓️ Solana Program

The on-chain program is deployed to **Solana Devnet**:

| | Details |
|---|---------|
| **Program ID** | `5AaoN6kBmNoEqTiNPaV2y1am9QrEEHwgRHneR1QNExLm` |
| **Framework** | Anchor |
| **Network** | Devnet |
| **Token** | USDC (SPL) |

### Program Instructions

| Instruction | Description |
|------------|-------------|
| `initialize` | Initialize the platform PDA and fee vault |
| `create_tournament` | Create a tournament with entry fee, cap, and duration |
| `join_tournament` | Join and stake USDC to the prize vault |
| `submit_team` | Submit a 15-player squad on-chain |
| `update_scores` | Update player scores from FPL gameweek data |
| `distribute_prizes` | Pay winners (50/30/20 split) from prize vault |
| `start_tournament` | Lock registration and begin scoring |
| `end_tournament` | Finalize results |
| `claim_prize` | Winner claims their USDC payout |
| `cancel_tournament` | Refund all participants |
| `update_platform` | Admin: update platform settings |
| `withdraw_fees` | Admin: withdraw platform fees |

### Verification

All transactions are verifiable on [Solana Explorer](https://explorer.solana.com/?cluster=devnet).

---

## 📁 Project Structure

```
mobile/
├── app/                    # Expo Router pages
│   ├── (tabs)/             # Tab-based navigation
│   │   ├── index.tsx       # Home / Dashboard
│   │   ├── tournaments/    # Tournament list, detail, create
│   │   ├── team/           # Team builder, squad management
│   │   ├── leaderboard.tsx # Global leaderboard
│   │   └── profile/        # Profile, wallet, settings
│   └── _layout.tsx         # Root layout
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/             # Button, Card, Input, Modal, etc.
│   │   └── layout/         # Header, CustomTabBar
│   ├── hooks/              # Custom hooks
│   │   ├── useFootballFusion.ts  # Solana program interactions
│   │   ├── useSolanaWallet.ts    # Wallet management
│   │   ├── useTournaments.ts     # Tournament CRUD
│   │   └── useFPLPlayers.ts      # FPL player data
│   ├── lib/
│   │   ├── api/            # Supabase API functions
│   │   ├── constants/      # Solana config, formations, IDL
│   │   └── supabase/       # Supabase client
│   ├── stores/             # Zustand state stores
│   ├── contexts/           # React contexts (Toast)
│   └── theme/              # Colors, typography, spacing
├── assets/                 # Fonts, images, icons
├── eas.json                # EAS Build configuration
├── PITCH_DECK.md           # Hackathon pitch deck
└── package.json
```

---

## 🏆 Hackathon

Built for the **Solana Monolith Hackathon** — a 5-week sprint to build mobile dApps for the Solana dApp Store.

- 📄 [Pitch Deck](./PITCH_DECK.md)
- 📦 [APK Download](https://expo.dev/accounts/web3normad/projects/football-fusion/builds/351ab705-d4f6-4cc1-a3b0-4939ffe6ef87)
- 🎥 Demo Video — *Coming soon*

---

## 📄 License

MIT

---

**Built by [FonioLabs](https://github.com/foniolabs)** 🇳🇬
