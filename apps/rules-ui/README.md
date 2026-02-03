# InsurRateX Rules UI

Business rules management interface for insurance rating without coding.

## Features

- **Dashboard**: Overview of all rules with statistics
- **3 Rule Types**:
  - **Lookup Tables**: Simple key-value mappings
  - **Decision Tables**: Multi-condition logic with rows
  - **Conditional Rules**: If-then-else business logic
- **Visual Editors**: No-code rule creation
- **Real-time Testing**: Test rules with sample data
- **Version Control**: Track rule changes
- **Multi-Product Support**: GL, Property, WC, Auto

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development
- **TailwindCSS** for styling
- **React Query** for data fetching
- **React Table** for table management
- **React Hook Form** for form handling
- **Zod** for validation

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at http://localhost:8081

### Environment Variables

Create a `.env` file:

```bash
VITE_API_URL=http://localhost:3000/api/v1
VITE_ENV=development
```

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Lint code
npm run lint
```

## Rule Types

### 1. Lookup Tables

Simple key-value mappings for transformations.

**Example: State Surcharges**
```
CA → 5.0%
NY → 8.0%
TX → 3.5%
```

**Use Cases**:
- State territorial surcharges
- Business type classifications
- Coverage type mappings
- Commission rate tables

### 2. Decision Tables

Multi-condition decision logic evaluated in order.

**Example: Experience Modifier**
```
Conditions: claimCount, totalIncurred
Actions: modifier

claimCount | totalIncurred | modifier
-----------+---------------+---------
0          | 0             | -5.0
1          | <10000        | 0
1          | >=10000       | 5.0
>=2        | *             | 10.0
```

**Use Cases**:
- Experience modifiers
- Tiered discounts
- Risk classifications
- Underwriting decisions

### 3. Conditional Rules

If-then-else logic with multiple conditions and actions.

**Example: High Revenue Surcharge**
```
IF
  insured.annualRevenue > 5000000
THEN
  Apply surcharge to premium: 4.0%
```

**Use Cases**:
- Complex business rules
- Multi-factor adjustments
- Special case handling
- Quote rejections

## Project Structure

```
src/
├── api/                     # API client
│   └── rules.ts            # Rules API
├── components/             # Reusable components
│   └── Layout.tsx          # App layout
├── pages/                  # Page components
│   ├── Dashboard.tsx           # Dashboard
│   ├── LookupTables.tsx        # List lookup tables
│   ├── LookupTableEditor.tsx   # Edit lookup table
│   ├── DecisionTables.tsx      # List decision tables
│   ├── DecisionTableEditor.tsx # Edit decision table
│   ├── ConditionalRules.tsx    # List conditional rules
│   └── ConditionalRuleEditor.tsx # Edit conditional rule
├── App.tsx                 # Root component
├── main.tsx                # Entry point
└── index.css               # Global styles
```

## Usage Examples

### Creating a Lookup Table

1. Navigate to "Lookup Tables"
2. Click "New Lookup Table"
3. Enter name and description
4. Add key-value entries
5. Save

### Creating a Decision Table

1. Navigate to "Decision Tables"
2. Click "New Decision Table"
3. Define conditions (input columns)
4. Define actions (output columns)
5. Add decision rows
6. Fill in values for each cell
7. Save

### Creating a Conditional Rule

1. Navigate to "Conditional Rules"
2. Click "New Conditional Rule"
3. Add conditions (IF part)
4. Add actions (THEN part)
5. Preview the rule logic
6. Save

## API Integration

The UI connects to the InsurRateX Orchestrator API:

**Endpoints**:
- `GET /api/v1/rules` - List all rules
- `GET /api/v1/rules/:id` - Get rule details
- `POST /api/v1/rules` - Create rule
- `PUT /api/v1/rules/:id` - Update rule
- `DELETE /api/v1/rules/:id` - Delete rule
- `POST /api/v1/rules/:id/test` - Test rule

## Docker

### Build Image

```bash
docker build -t insurratex/rules-ui:latest .
```

### Run Container

```bash
docker run -p 8081:8081 insurratex/rules-ui:latest
```

## Deployment

### Production Build

```bash
npm run build
```

Output in `dist/` directory.

### Deploy with Docker Compose

The rules UI is included in the main docker-compose.yml:

```bash
docker-compose up rules-ui
```

## Future Enhancements

- [ ] AI-powered rule suggestions
- [ ] Natural language rule input
- [ ] Rule conflict detection
- [ ] Rule impact analysis
- [ ] Bulk rule operations
- [ ] Rule versioning and rollback
- [ ] Collaborative editing
- [ ] Rule templates library
- [ ] Advanced testing scenarios
- [ ] Rule performance analytics

## Contributing

See main project [CONTRIBUTING.md](../../CONTRIBUTING.md)

## License

MIT

---

Part of the InsurRateX platform - Making insurance business rules manageable without code.
