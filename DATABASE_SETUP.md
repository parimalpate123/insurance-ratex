# PostgreSQL Database Setup Guide

## Quick Start

```bash
# Start everything with database
./start-with-database.sh
```

That's it! The script will:
1. Start PostgreSQL container
2. Wait for it to be ready
3. Initialize the database with schema
4. Start all other services

## What Gets Created

### Database Schema

**Mappings:**
- `mappings` - Mapping configurations (Guidewire→CDM, CDM→Earnix, etc.)
- `field_mappings` - Individual field mapping rules

**Rules:**
- `conditional_rules` - IF-THEN business rules
- `rule_conditions` - Rule conditions (IF part)
- `rule_actions` - Rule actions (THEN part)
- `lookup_tables` - Key-value lookup tables
- `lookup_entries` - Lookup table entries
- `decision_tables` - Decision table definitions
- `decision_table_rows` - Decision table rules

### Sample Data

The database is initialized with:
- 2 sample mappings (Guidewire→CDM, CDM→Earnix)
- 1 sample conditional rule (High Revenue Surcharge)

## Manual Database Operations

### Connect to Database

```bash
# Using docker-compose
docker-compose exec postgres psql -U insurratex -d insurratex

# Using local psql (if installed)
psql -h localhost -U insurratex -d insurratex
# Password: dev_password_change_in_prod
```

### View Tables

```sql
-- List all tables
\dt

-- Describe a table
\d mappings
\d conditional_rules

-- View sample data
SELECT * FROM mappings;
SELECT * FROM conditional_rules;
```

### Reset Database

```bash
# Stop and remove database volume
docker-compose down -v

# Start fresh
./start-with-database.sh
```

### Backup Database

```bash
# Backup
docker-compose exec -T postgres pg_dump -U insurratex insurratex > backup.sql

# Restore
docker-compose exec -T postgres psql -U insurratex -d insurratex < backup.sql
```

## Database Configuration

### Environment Variables

In `docker-compose.yml`:
```yaml
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=insurratex
DB_PASSWORD=dev_password_change_in_prod
DB_DATABASE=insurratex
```

### Connection String

```
postgresql://insurratex:dev_password_change_in_prod@localhost:5432/insurratex
```

## Database Tools

### GUI Clients

**DBeaver (Free, Cross-platform)**
- Download: https://dbeaver.io/
- Connection: localhost:5432, user: insurratex

**pgAdmin (Free, Web-based)**
```bash
docker run -p 5050:80 \
  -e 'PGADMIN_DEFAULT_EMAIL=admin@admin.com' \
  -e 'PGADMIN_DEFAULT_PASSWORD=admin' \
  --network insurratex-network \
  dpage/pgadmin4
```
Then go to http://localhost:5050

**TablePlus (Paid, Mac/Windows)**
- Download: https://tableplus.com/

### VS Code Extension

Install: **PostgreSQL** by Chris Kolkman
- Connect to localhost:5432
- User: insurratex
- Password: dev_password_change_in_prod

## Troubleshooting

### PostgreSQL won't start

```bash
# Check logs
docker-compose logs postgres

# Remove volume and restart
docker-compose down -v
./start-with-database.sh
```

### Can't connect from orchestrator

```bash
# Check if postgres is healthy
docker-compose ps

# Test connection
docker-compose exec postgres pg_isready -U insurratex

# Check orchestrator logs
docker-compose logs orchestrator
```

### Schema not created

```bash
# Check if init.sql ran
docker-compose logs postgres | grep "init.sql"

# Manually run init script
docker-compose exec -T postgres psql -U insurratex -d insurratex < database/init.sql
```

## Next Steps

Once the database is running:

1. **Test the API** - The orchestrator now connects to PostgreSQL
2. **Save a Rule** - Rules UI can now persist rules to the database
3. **Create Mappings** - Mapping UI can save mapping configurations
4. **View Data** - Use a database client to see saved data

## Migration to Production

For production deployment:
1. Use AWS RDS PostgreSQL (we'll create Terraform for this later)
2. Change password from default
3. Enable SSL connections
4. Set up automated backups
5. Configure read replicas for scaling

---

📝 **Note**: This is for local development. Production database will use AWS RDS with proper security, backups, and monitoring.
