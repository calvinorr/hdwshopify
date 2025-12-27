This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Database Backup & Recovery

### Manual Backups

Create a local JSON backup of all database tables:

```bash
npm run db:backup
```

This creates a timestamped backup file in the `backups/` directory (not committed to git).

### Restore Process

To restore from a backup:

1. Open the backup JSON file to review the data
2. Use Drizzle Studio to manually restore critical tables:
   ```bash
   npm run db:studio
   ```
3. Or write a restore script using the JSON data

### Turso Automatic Backups

Turso provides automatic point-in-time recovery (PITR) on paid plans:

- **Free tier**: No automatic backups - use `npm run db:backup` regularly
- **Scaler/Pro tiers**: Automatic backups with 24-hour retention
- **Enterprise**: Extended retention and custom backup schedules

To restore from Turso's backups:
1. Go to Turso Dashboard > Database > Backups
2. Select a restore point
3. Create a new database from that point

For production, consider:
- Running `npm run db:backup` before major deployments
- Setting up a weekly backup cron job
- Storing backups in cloud storage for redundancy

## Full Data Export (GDPR Compliance)

Export all business data in a human-readable format:

```bash
npm run data:export
```

This creates a timestamped folder in `exports/` containing:
- `products.json` - Products with variants and images
- `customers.json` - Customers with addresses
- `orders.json` - Orders with items and events
- `settings.json` - Site settings, shipping zones, discount codes
- `manifest.json` - Export metadata and counts

### GDPR Compliance

For customer data requests:
1. Run `npm run data:export`
2. Open `customers.json` to find the specific customer
3. Provide the customer with their data

Note: Exports do NOT include passwords or payment card details.
