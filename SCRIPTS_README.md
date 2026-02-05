# InsurRateX - Quick Scripts Guide

Convenient scripts to manage your InsurRateX services.

## 🚀 Main Restart Script

### `./restart.sh`
The all-in-one restart script with options.

**Usage:**
```bash
./restart.sh                  # Normal restart
./restart.sh --build          # Rebuild and restart (use after code changes)
./restart.sh --quick          # Quick restart (no rebuild, fastest)
./restart.sh --logs           # Show logs after restart
./restart.sh --quick --logs   # Quick restart with logs
```

**When to use each option:**
- **No options** - Normal restart when services are acting up
- **--build** - After you make code changes to backend or frontend
- **--quick** - When you just need to restart without rebuilding
- **--logs** - When you want to see what's happening after restart

---

## 📂 Helper Scripts (in `scripts/` directory)

### Service Management

#### `scripts/start.sh`
Start all services (if they're stopped).
```bash
./scripts/start.sh
```

#### `scripts/stop.sh`
Stop all services.
```bash
./scripts/stop.sh
```

#### `scripts/status.sh`
Check the status of all services and run health checks.
```bash
./scripts/status.sh
```

#### `scripts/logs.sh`
View logs for services.
```bash
./scripts/logs.sh                    # All services
./scripts/logs.sh orchestrator       # Orchestrator only
./scripts/logs.sh mapping-ui         # Mapping UI only
```

**Available services:**
- `orchestrator` - Main API server
- `mapping-ui` - Mapping interface
- `rules-ui` - Rules interface
- `postgres` - Database
- `guidewire-mock` - Guidewire mock
- `earnix-mock` - Earnix mock

---

### Field Catalog

#### `scripts/view-catalog.sh`
View the Master Field Catalog from command line.
```bash
./scripts/view-catalog.sh            # View all fields
./scripts/view-catalog.sh policy     # View policy fields only
./scripts/view-catalog.sh coverage   # View coverage fields
./scripts/view-catalog.sh insured    # View insured fields
./scripts/view-catalog.sh claim      # View claim fields
./scripts/view-catalog.sh rating     # View rating fields
./scripts/view-catalog.sh vehicle    # View vehicle fields
```

---

## 🔧 Common Scenarios

### After Making Code Changes
```bash
./restart.sh --build
```

### Services Not Responding
```bash
./restart.sh
```

### Check What's Wrong
```bash
./scripts/status.sh
./scripts/logs.sh orchestrator
```

### Quick Restart
```bash
./restart.sh --quick
```

### View Field Catalog
```bash
./scripts/view-catalog.sh
```

---

## 🌐 Access Points

After starting services:

- **Mapping UI**: http://localhost:8080
- **Rules UI**: http://localhost:8081
- **Orchestrator API**: http://localhost:3000
- **API Health Check**: http://localhost:3000/health

### API Endpoints

- **Field Catalog**: http://localhost:3000/api/v1/field-catalog
- **Data Types**: http://localhost:3000/api/v1/data-types
- **Mappings**: http://localhost:3000/api/v1/mappings

---

## 💡 Tips

1. **Always use `--build`** after pulling code changes or modifying source files
2. **Use `--quick`** for fastest restart when you just need to bounce services
3. **Check logs** if something isn't working: `./scripts/logs.sh <service>`
4. **View status** regularly: `./scripts/status.sh`
5. **Browse catalog visually** in the Mapping UI instead of CLI when creating mappings

---

## 🐛 Troubleshooting

### Services won't start
```bash
# Stop everything
./scripts/stop.sh

# Check what's running
docker ps -a

# Clean restart with rebuild
./restart.sh --build --logs
```

### Port conflicts
```bash
# Check what's using the ports
lsof -i :3000  # Orchestrator
lsof -i :8080  # Mapping UI
lsof -i :5432  # PostgreSQL
```

### Database issues
```bash
# Connect to database
docker exec -it insurratex-postgres psql -U insurratex -d insurratex

# View field catalog
docker exec insurratex-postgres psql -U insurratex -d insurratex -c "SELECT * FROM field_catalog LIMIT 10;"
```

---

## 📝 Notes

- Scripts are located in the project root and `scripts/` directory
- All scripts are executable (chmod +x already applied)
- Use `./script-name.sh --help` for more options (where available)
