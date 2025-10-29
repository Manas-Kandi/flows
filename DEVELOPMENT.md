# Development Guide

Comprehensive guide for developing Flows CAD platform.

## Architecture Overview

Flows follows a microservices architecture with:
- **Frontend**: React/TypeScript SPA with Three.js for 3D rendering
- **Services**: Independent microservices for collaboration, geometry, etc.
- **Infrastructure**: Kubernetes-based deployment on cloud providers

## Local Development

### Starting the Full Stack

```bash
# Start infrastructure services
docker-compose up -d redis postgres kafka

# Start all development servers in parallel
pnpm dev

# Or start individual services
pnpm --filter @flows/web dev
pnpm --filter @flows/collaboration dev
```

### Environment Variables

Create `.env.local` in each service directory:

**apps/web/.env.local**
```env
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8081
VITE_GEOMETRY_URL=http://localhost:8082
```

**services/collaboration/.env.local**
```env
PORT=8081
REDIS_HOST=localhost
REDIS_PORT=6379
KAFKA_BROKERS=localhost:9092
LOG_LEVEL=debug
```

**services/geometry/.env.local**
```env
PORT=8082
GIN_MODE=debug
```

## Development Workflows

### Adding a New Feature

1. **Create feature branch**
   ```bash
   git checkout -b feature/my-new-feature develop
   ```

2. **Implement feature**
   - Add types in `apps/web/src/types/`
   - Create components in `apps/web/src/components/`
   - Add state management in `apps/web/src/stores/`
   - Implement backend logic in appropriate service

3. **Write tests**
   ```bash
   pnpm test
   ```

4. **Update documentation**
   - Update README if needed
   - Add JSDoc comments
   - Update type definitions

5. **Create pull request**

### Debugging

#### Web Client
- Use React DevTools browser extension
- Check browser console for errors
- Use Redux DevTools for state inspection
- Network tab for API calls

#### Backend Services
```bash
# Collaboration service logs
docker-compose logs -f collaboration

# Geometry service logs
docker-compose logs -f geometry
```

#### Three.js Viewport
- Enable Three.js devtools
- Use `scene.traverse()` to inspect objects
- Monitor frame rate with stats.js

### Testing Strategies

#### Unit Tests
```typescript
// Example unit test
import { describe, it, expect } from 'vitest';
import { calculateDistance } from './geometry';

describe('geometry utilities', () => {
  it('calculates distance between two points', () => {
    const result = calculateDistance({ x: 0, y: 0 }, { x: 3, y: 4 });
    expect(result).toBe(5);
  });
});
```

#### Integration Tests
```typescript
// Example API test
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('POST /api/sketch/solve', () => {
  it('solves constrained sketch', async () => {
    const response = await request(app)
      .post('/api/sketch/solve')
      .send({ entities: [], constraints: [] });
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('solved');
  });
});
```

#### E2E Tests
```typescript
// Example Playwright test
import { test, expect } from '@playwright/test';

test('create and extrude sketch', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('[data-testid="new-sketch"]');
  await page.click('[data-testid="draw-rectangle"]');
  // ... interact with viewport
  await page.click('[data-testid="extrude"]');
  await expect(page.locator('[data-testid="3d-model"]')).toBeVisible();
});
```

## Performance Optimization

### Frontend
- Use React.memo() for expensive components
- Implement virtualization for long lists
- Optimize Three.js scene with LOD (Level of Detail)
- Use Web Workers for heavy computations

### Backend
- Use Redis caching strategically
- Implement database query optimization
- Use connection pooling
- Monitor memory usage

### Monitoring
```bash
# Check service health
curl http://localhost:8081/health
curl http://localhost:8082/health

# View metrics
docker stats
```

## Database Management

### Migrations
```bash
# Create migration
pnpm migration:create add_users_table

# Run migrations
pnpm migration:run

# Rollback
pnpm migration:rollback
```

### Seeding Data
```bash
# Seed development data
pnpm seed:dev

# Seed test data
pnpm seed:test
```

## API Documentation

### REST APIs
- Collaboration: http://localhost:8081/api-docs
- Geometry: http://localhost:8082/api-docs

### WebSocket Events

**Connection**
```typescript
const ws = new WebSocket('ws://localhost:8081/ws?projectId=123&userId=456');
```

**Messages**
```typescript
// Update message
ws.send(JSON.stringify({
  type: 'update',
  update: [/* CRDT update */],
}));

// Presence update
ws.send(JSON.stringify({
  type: 'presence',
  data: { cursor: { x: 0, y: 0, z: 0 } },
}));
```

## Troubleshooting

### Common Issues

**Port already in use**
```bash
# Find process using port
lsof -i :3000
# Kill process
kill -9 <PID>
```

**Dependencies out of sync**
```bash
# Clean install
rm -rf node_modules
pnpm install --frozen-lockfile
```

**Docker issues**
```bash
# Reset Docker
docker-compose down -v
docker-compose up -d
```

**TypeScript errors**
```bash
# Rebuild types
pnpm type-check
```

## Best Practices

### Code Organization
- Keep components small (< 200 lines)
- Extract reusable logic to hooks
- Use TypeScript strictly
- Follow single responsibility principle

### State Management
- Use Zustand for global state
- Keep state normalized
- Avoid prop drilling with context
- Use selectors for derived state

### Performance
- Lazy load routes and components
- Memoize expensive calculations
- Use proper React keys in lists
- Avoid unnecessary re-renders

### Security
- Never commit secrets
- Validate all inputs
- Sanitize user data
- Use HTTPS in production
- Implement rate limiting

## Release Process

1. **Version bump**
   ```bash
   pnpm changeset
   pnpm version-packages
   ```

2. **Create release branch**
   ```bash
   git checkout -b release/v1.0.0 develop
   ```

3. **Run full test suite**
   ```bash
   pnpm test
   pnpm build
   ```

4. **Merge to main**
   ```bash
   git checkout main
   git merge release/v1.0.0
   git tag v1.0.0
   git push origin main --tags
   ```

5. **Deploy**
   - CI/CD automatically deploys on tag push
   - Monitor deployment in AWS/Azure console
   - Verify health checks pass

## Additional Resources

- [Product Blueprint](./docs/cloud-native-industrial-cad-plan.md)
- [API Documentation](./docs/api/)
- [Architecture Decision Records](./docs/adr/)
- [Deployment Guide](./docs/deployment.md)
