# InsurRateX Mapping UI

Visual interface for creating and managing field mappings between insurance systems.

## Features

- **Visual Mapping Editor**: Drag-and-drop interface for field mappings
- **10 Transformation Types**: Direct, lookup, expression, conditional, etc.
- **Real-time Testing**: Test mappings with sample data
- **Version Control**: Track mapping versions and changes
- **Multi-System Support**: Connect any policy system to any rating engine

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and builds
- **TailwindCSS** for styling
- **React Flow** for visual node-based editor
- **React Query** for data fetching
- **Zustand** for state management
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at http://localhost:8080

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

## Docker

### Build Image

```bash
docker build -t insurratex/mapping-ui:latest .
```

### Run Container

```bash
docker run -p 8080:8080 \
  -e VITE_API_URL=http://localhost:3000/api/v1 \
  insurratex/mapping-ui:latest
```

## Project Structure

```
src/
├── api/                  # API client functions
│   └── mappings.ts      # Mapping API
├── components/          # Reusable components
│   └── Layout.tsx       # App layout
├── pages/               # Page components
│   ├── MappingsList.tsx    # List all mappings
│   ├── NewMapping.tsx      # Create new mapping
│   └── MappingEditor.tsx   # Visual mapping editor
├── App.tsx              # Root component
├── main.tsx             # Entry point
└── index.css            # Global styles
```

## Key Concepts

### Field Mapping

A field mapping defines how to transform data from a source field to a target field:

```typescript
{
  source: "$.Quote.QuoteNumber",
  target: "policyId",
  type: "direct",
  required: true
}
```

### Transformation Types

1. **Direct**: Simple 1:1 field mapping
2. **Lookup**: Use lookup table to transform values
3. **Expression**: JavaScript expression for transformation
4. **Conditional**: If-then-else logic
5. **Static**: Static value assignment
6. **Concat**: Combine multiple fields
7. **Split**: Split field into multiple targets
8. **Aggregate**: Aggregate array values
9. **Custom**: Custom JavaScript function
10. **Nested**: Handle nested object structures

### Testing Mappings

Use the built-in test panel to:
1. Paste sample source data (JSON)
2. Run transformation
3. Verify output matches expected CDM format
4. Debug transformation issues

## API Integration

The UI connects to the InsurRateX Orchestrator API:

**Endpoints Used:**
- `GET /api/v1/mappings` - List mappings
- `GET /api/v1/mappings/:id` - Get mapping details
- `POST /api/v1/mappings` - Create mapping
- `PUT /api/v1/mappings/:id` - Update mapping
- `DELETE /api/v1/mappings/:id` - Delete mapping
- `POST /api/v1/mappings/:id/test` - Test mapping

## Usage Examples

### Creating a New Mapping

1. Click "New Mapping" button
2. Select source system (e.g., Guidewire)
3. Select target system (e.g., CDM)
4. Choose product line (e.g., General Liability)
5. Click "Create & Edit Mappings"

### Adding Field Mappings

1. Click "Add Field" button
2. Enter source path (JSONPath format): `$.Quote.QuoteNumber`
3. Enter target field: `policyId`
4. Select transformation type: `direct`
5. Mark as required if needed
6. Add description
7. Save

### Testing a Mapping

1. Open mapping editor
2. Click "Test Mapping" button
3. Paste sample JSON data
4. Click "Run Test"
5. Review transformed output
6. Debug any issues

## Customization

### Adding New Transformation Types

Edit `src/pages/MappingEditor.tsx`:

```typescript
<select>
  <option value="custom-type">Custom Type</option>
</select>
```

### Styling

Uses TailwindCSS. Customize in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: { ... }
    }
  }
}
```

## Deployment

### Production Build

```bash
npm run build
```

Output in `dist/` directory.

### Deploy to Nginx

```bash
# Copy built files
cp -r dist/* /var/www/html/

# Configure nginx
cp nginx.conf /etc/nginx/conf.d/mapping-ui.conf

# Reload nginx
sudo nginx -s reload
```

### Deploy with Docker

```bash
# Build image
docker build -t insurratex/mapping-ui:1.0.0 .

# Push to registry
docker push insurratex/mapping-ui:1.0.0

# Deploy
docker run -d -p 8080:8080 insurratex/mapping-ui:1.0.0
```

## Troubleshooting

### API Connection Issues

Check proxy configuration in `vite.config.ts`:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

### Build Failures

Clear cache and reinstall:

```bash
rm -rf node_modules dist
npm install
npm run build
```

## Future Enhancements

- [ ] AI-powered mapping suggestions
- [ ] Visual node-based editor with React Flow
- [ ] Drag-and-drop field mapping
- [ ] Mapping templates library
- [ ] Bulk field operations
- [ ] Collaborative editing
- [ ] Version diff viewer
- [ ] Mapping analytics

## Contributing

See main project [CONTRIBUTING.md](../../CONTRIBUTING.md)

## License

MIT

---

Part of the InsurRateX platform - Making insurance system integration simple.
