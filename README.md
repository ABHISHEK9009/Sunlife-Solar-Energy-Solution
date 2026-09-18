# Sunlife Solar Energy Solution

Clean, sustainable, and reliable solar energy solutions.

## Overview
Sunlife Solar Energy Solution is dedicated to providing efficient renewable energy systems, commercial & residential solar power installations, and sustainable energy management.

## Features
- Residential & Commercial Solar Installations
- Smart Energy Inverters & Battery Storage
- System Maintenance & Performance Monitoring
- Clean Energy Analytics & ROI Estimation

## Getting Started
Clone the repository:
```bash
git clone https://github.com/ABHISHEK9009/Sunlife-Solar-Energy-Solution.git
```

## License
MIT License

## Database and live admin data

Use Node.js 20.12 or newer. Put the Sunlife connection in `.env` (see `.env.example`).
`npm run dev`, `npm run build`, and `npm start` explicitly load the database values
from this project's `.env` before launching Next.js. The runner and Prisma runtime
guard reject hosts other than the approved Sunlife Neon host. When no `.env` exists
(for example in deployment), the environment's database URL must pass the same check.
Never run raw Prisma database commands with an inherited database URL.

- `npm run db:check`: verifies access to CRM/workforce tables using read-only counts.
- `npm test`: tests database targeting, request failures, and refresh behavior without database writes.
- `npm run build`: generates the Prisma client and checks the production build; no migration or seed runs.

Admin screens refresh from PostgreSQL every five seconds while visible and online,
and refresh on focus, reconnection, and successful saves in another browser tab.
This is polling, not WebSocket database subscriptions. API reads are dynamic and
browser reads bypass the cache. Failed reads preserve the last loaded data and show
an error. Draft forms remain local until saved.

The team screen loads its roster, attendance, advances, and payroll from the shared
database. Opening the screen does not import localStorage or create sample employees,
attendance, or paid salaries. Saves await server confirmation and submit only changed
records. Advance settlements and monthly payment records are saved in one transaction;
bulk attendance saves are also transactional. Removing a team member deactivates them
while retaining their history.

Deploy/restart the application to make these changes available on the public site.
