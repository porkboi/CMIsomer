# CMIsomer

## What?

Webapp to manage and host parties at CMU easily

## Features

- Waitlist management
- Quotas across different organisations
- Tax-free transfers
- Managed by your peers :)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher)
- [pnpm](https://pnpm.io/) package manager
- [Supabase](https://supabase.com/) account for database

### Installation

1. **Clone the repository**

   ```bash
   git clone git@github.com:porkboi/CMIsomer.git
   cd CMIsomer
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory and add your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**

   ```bash
   pnpm dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

### Available Scripts

- `pnpm dev` - Start the development server
- `pnpm build` - Build the application for production
- `pnpm start` - Start the production server
- `pnpm lint` - Run ESLint to check for code issues

## TODO:

- Proper /about
- Announcement page on ticket page / Email Announcement (emailJS API)
- Add Organisations on Dashboard screen
- Edit Party Details on Dashboard screen
- Custom Fields on Dashboard screen
- Business Cards (figure out how)
- Add photo
- make Paynow/Paylah (SG) deeplink
- Google Calendar Integration (@porkboi)
- Google Wallet/ Apple Wallet (colby)
- Waiting Room (paywalled)
- User Management System
- Promo Code Generator (colby)
