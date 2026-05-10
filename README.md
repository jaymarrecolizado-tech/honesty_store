# Electronic Honesty Store

A web-based self-service Point-of-Sale (POS) and inventory system for DICT Region 2 staff. Built with Next.js 14, PocketBase, and MySQL.

## Features

- **Self-Service Shopping**: Mobile-first interface for browsing and purchasing products
- **Debt Management**: Utang system with configurable ceilings and balance tracking
- **Admin Dashboard**: Inventory management, debt monitoring, and sales reporting
- **Real-time Stock**: Atomic stock decrement to prevent overselling
- **Audit Trail**: Complete transaction and inventory change logging

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: PocketBase (Go-based backend-as-a-service)
- **Database**: MySQL 8 InnoDB (via PocketBase)
- **Deployment**: Docker Compose with nginx reverse proxy

## Quick Start

### Prerequisites

- Docker Engine 25+
- Docker Compose v2
- Node.js 18+ (for local development)
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd electronic-honesty-store
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Start the development environment**
   ```bash
   # Build and start all services
   docker-compose up --build

   # Or for development with hot reload
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - PocketBase Admin: http://localhost:8090/_

5. **Seed demo data**
   ```bash
   # After creating an admin user in PocketBase
   node scripts/seed.js
   ```

### Production Deployment

1. **Set up your server** (Ubuntu 22.04 recommended)
   ```bash
   # Install Docker and Docker Compose
   sudo apt update
   sudo apt install docker.io docker-compose-plugin

   # Clone repository
   git clone <repository-url>
   cd electronic-honesty-store
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

3. **Set up SSL certificates**
   ```bash
   sudo certbot certonly --standalone -d your-domain.com
   # Copy certificates to nginx/ssl/
   ```

4. **Deploy**
   ```bash
   docker-compose -f docker-compose.yml up -d --build
   ```

5. **First boot setup**
   ```bash
   # The containers will start and PocketBase will run migrations automatically
   # Access PocketBase admin at https://your-domain.com/_
   # Create admin user and run seed script
   docker-compose exec nextjs node scripts/seed.js
   ```

## Project Structure

```
├── pocketbase/           # PocketBase service
│   ├── Dockerfile       # Custom PocketBase with MySQL driver
│   └── pb_data/         # PocketBase data volume
├── pb_migrations/       # Database migrations
├── pb_hooks/           # Business logic hooks
├── scripts/            # Utility scripts
├── src/
│   ├── app/            # Next.js App Router pages
│   ├── components/     # Reusable React components
│   ├── lib/            # Utility libraries
│   └── stores/         # Zustand state management
├── nginx/              # Reverse proxy configuration
├── docker-compose.yml  # Multi-service orchestration
└── Dockerfile          # Next.js container build
```

## Key Workflows

### Self-Service Checkout
1. Customer browses products by category
2. Adds items to cart
3. Selects payment method (cash or debt/utang)
4. System validates stock and debt ceiling
5. Atomic transaction: decrements stock, creates order, updates debt ledger
6. Generates receipt and audit trail

### Admin Operations
- **Inventory Management**: CRUD operations on products and categories
- **Debt Monitoring**: View balances, process payments, set ceilings
- **Reports**: Sales analytics, stock levels, debt summaries
- **Audit Logs**: Complete transaction history

## Database Schema

### Core Tables
- `users`: Authentication and debt ceilings
- `categories`: Product categorization
- `products`: Inventory with stock levels
- `orders`: Purchase transactions
- `order_items`: Order line items
- `debt_ledger`: Immutable debt transactions
- `stock_movements`: Inventory changes audit
- `audit_logs`: System activity logging

### Key Constraints
- Balance computed from `debt_ledger` (never stored)
- Stock decrement atomic with row-level locking
- Debt ceiling enforcement at checkout
- Immutable audit trails

## API Endpoints

### Public Endpoints
- `GET /api/collections/products/records` - List products
- `POST /api/auth-with-password` - User authentication

### Protected Endpoints
- `POST /api/checkout` - Process purchase (transactional)
- `GET /api/debt/balance` - User debt status
- `POST /api/debt/payments` - Record debt payments (admin only)

### Admin Endpoints
- `GET /api/reports/stock-levels` - Inventory reports
- `GET /api/reports/debt-summary` - Debt analytics
- `GET /api/reports/sales` - Sales reports

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- ESLint and Prettier configured
- Component naming: PascalCase
- File naming: kebab-case
- State management: Zustand stores

### Testing
- Unit tests for business logic
- Integration tests for API contracts
- E2E tests for critical user journeys
- Visual regression for UI components

### Security
- Input validation on all forms
- SQL injection prevention via PocketBase
- XSS protection via React
- CSRF protection via SameSite cookies
- Rate limiting via nginx

## Deployment Checklist

- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Domain DNS configured
- [ ] Firewall rules set (ports 80, 443)
- [ ] Docker services running
- [ ] PocketBase migrations applied
- [ ] Admin user created
- [ ] Demo data seeded
- [ ] nginx configuration validated
- [ ] Monitoring/alerting configured

## Troubleshooting

### Common Issues

**PocketBase MySQL Connection Failed**
- Ensure MySQL container is running
- Check DB_* environment variables
- Verify MySQL user permissions

**Build Failures**
- Clear Docker cache: `docker system prune -a`
- Check Node.js version compatibility
- Verify all environment variables are set

**Authentication Issues**
- Clear browser cookies
- Check PocketBase admin panel
- Verify JWT token expiration

### Logs

```bash
# View service logs
docker-compose logs -f [service-name]

# View PocketBase logs specifically
docker-compose logs -f pocketbase

# Check nginx error logs
docker-compose exec nginx tail -f /var/log/nginx/error.log
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.