# Asset Monitoring System - App Guidelines

## UI/UX Preferences

### Design Principles
- **Consistency**: Maintain consistent styling, spacing, and interaction patterns across the application
- **Simplicity**: Focus on clean, uncluttered interfaces that emphasize the data
- **Accessibility**: Ensure the application is usable by people with various abilities
- **Responsiveness**: Design for desktop-first but ensure functionality on tablets

### Layout Structure
- Responsive design optimized for desktop and tablet interfaces
- Sidebar navigation with collapsible menus for efficient navigation
- Dashboard as the primary landing page for all users
- Card-based visualization for equipment status and metrics

### Color System
- Primary color to represent the brand
- Secondary colors for actions and highlights
- Status colors:
  - Green: Normal/Good
  - Yellow/Orange: Warning
  - Red: Critical/Alert
  - Gray: Inactive/Offline

### Typography
- Sans-serif font family for readability
- Consistent heading hierarchy (H1-H6)
- Adequate contrast for text readability

### Component Guidelines
- Consistent padding and margin spacing
- Interactive elements should have clear hover and active states
- Form fields should include validation states and helpful error messages
- Tables should support sorting, filtering, and pagination for large datasets
- Cards should have consistent header/body/footer structures

### Navigation
- Main navigation in the sidebar
- Breadcrumbs for hierarchical navigation
- Back buttons where appropriate for multi-step processes
- Clear indication of current location within the application

## Technical Architecture

### Frontend Framework
- React Single-Page Application
- TypeScript for type safety and better developer experience

### Styling Approach
- Utilize Material-UI as a component library
- Customize components to match brand guidelines using Tailwind CSS
- Leverage built-in theming capabilities
- We should have a dark and a light theme, that can be chosen in user preferences

### State Management
- React Context API for state management
- React Query for server state management and caching

### API Integration
- RESTful API integration for CRUD operations
- Axios API for HTTP requests
- WebSocket for real-time updates
- Structured error handling and loading states with the reusable components to show errors

### Authentication & Authorization
- Auth is handled by AWS Cognito with the JWT based authentication
- Upon authenticating and loading the initial page the app should call the end point to bring the current user details, with the permissions and preferences
- Company-based data isolation
- Secure storage of auth tokens

### Performance Considerations
- Code splitting for reduced initial load times
- Lazy loading for non-critical components
- Memoization for expensive computations
- Virtualization for long lists
- Efficient re-rendering strategies

### Testing Strategy
- Unit tests for components and utilities
- Integration tests for complex interactions
- End-to-end tests for critical user flows
- Accessibility testing

### Coding Standards
- Follow React best practices
- Consistent file and folder structure
- Component composition over inheritance
- Prop typing and validation
- Meaningful component names and consistent naming conventions

## Deployment & Infrastructure
- CI/CD pipeline for automated testing and deployment
- Environment-specific configurations
- Error monitoring and logging
- Analytics for usage tracking