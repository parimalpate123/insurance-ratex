# InsurRateX Admin UI

Unified admin interface for managing configuration-driven rating platform.

## Features

### ✅ Dashboard
- Product line overview
- Quick statistics
- Workflow visualization
- Integration details
- Quick actions

### ✅ Product Line Management
- List all product lines
- View product line details
- Select active product line
- Filter and search

### ✅ Onboarding Wizard (5 Steps)
1. **Product Details** - Basic information and ownership
2. **System Connections** - Source and target system configuration
3. **Template Selection** - Choose from templates or start fresh
4. **Workflow Configuration** - Enable/disable workflow steps
5. **Review & Deploy** - Review and create product line

### ✅ Test Rating
- Execute rating workflows
- View real-time results
- Step-by-step execution tracking
- Rules applied tracking
- Performance metrics

### ⏳ Settings
- General settings (coming soon)
- User preferences (coming soon)
- API configuration (coming soon)

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **TanStack Query** - Data fetching & caching
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Axios** - HTTP client

## Getting Started

### Prerequisites
- Node.js 18+
- Rating API running on port 3002

### Installation

```bash
cd apps/admin-ui
npm install
```

### Development

```bash
npm run dev
```

App runs on http://localhost:5173

### Build

```bash
npm run build
npm run preview
```

### Docker

```bash
# From project root
docker-compose up admin-ui
```

## Project Structure

```
src/
├── api/              # API client and endpoints
│   ├── client.ts     # Axios client with interceptors
│   └── product-lines.ts  # Product line API
├── components/       # Reusable components
│   ├── Layout.tsx    # Main layout with navigation
│   └── ProductLineSelector.tsx
├── contexts/         # React contexts
│   └── ProductLineContext.tsx
├── pages/            # Page components
│   ├── Dashboard.tsx
│   ├── ProductLines.tsx
│   ├── ProductLineDetail.tsx
│   ├── OnboardingWizard.tsx
│   ├── TestRating.tsx
│   └── Settings.tsx
├── App.tsx           # Main app component
├── main.tsx          # Entry point
└── index.css         # Global styles
```

## API Integration

The UI communicates with the Rating API via proxy:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3002',
      changeOrigin: true,
    },
  },
}
```

## Key Features

### Product Line Context

Global state management for current product line:

```typescript
const {
  currentProductLine,     // Currently selected product line code
  setCurrentProductLine,  // Set current product line
  productLines,           // All product lines
  isLoading,             // Loading state
  refetch                // Refetch product lines
} = useProductLine();
```

### API Client

Centralized API client with interceptors:

```typescript
import { productLinesApi } from '@/api/product-lines';

// Get all product lines
const productLines = await productLinesApi.getAll();

// Execute rating
const result = await productLinesApi.executeRating(code, { data });
```

### TanStack Query Integration

Data fetching with caching:

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['product-lines'],
  queryFn: () => productLinesApi.getAll(),
});
```

## Styling

Uses Tailwind CSS with custom components:

```css
/* Buttons */
.btn             /* Base button */
.btn-primary     /* Primary action */
.btn-secondary   /* Secondary action */
.btn-danger      /* Dangerous action */

/* Cards */
.card            /* White card with shadow */

/* Forms */
.input           /* Form input */
.label           /* Form label */
```

## Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:3002
```

## Phase 3 Status

### ✅ Completed
- Project setup (Vite + React + TypeScript)
- Tailwind CSS configuration
- Layout with navigation
- Product line selector
- Dashboard page
- Product lines listing
- Product line detail view
- 5-step onboarding wizard
- Test rating interface
- Settings page (stub)
- Docker support
- API integration
- Context management

### 🚧 Future Enhancements
- Visual mapping builder (copy from mapping-ui)
- Visual rule builder (copy from rules-ui)
- Execution history viewer
- Template marketplace UI
- User authentication
- Permission management
- Analytics dashboard
- Export/import functionality

## License

Internal use only - InsurRateX platform
