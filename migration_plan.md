# Migration Plan: React App to Modern Industrial Dashboard

## 🎯 Project Goal

Transform the existing React application from a Material-UI based dashboard to a modern, industrial-focused equipment monitoring system that matches the design and functionality demonstrated in the Vercel example (`vercel_files/` folder). The screen examples are stored in vercel_files/screenshots.

### Vision

Create a professional, intuitive, and feature-rich industrial dashboard that provides:

- Real-time equipment monitoring and analytics
- Predictive maintenance capabilities
- Advanced reporting and data visualization
- Modern UI/UX with dark/light theme support
- Mobile-responsive design optimized for industrial environments

> **Note (current direction):** Phases 1–5 below are the original Material-UI →
> shadcn/ui migration plan and are largely complete. The product has since moved
> to an **exception-first, facility-health** direction. See **"✅ Shipped"** for
> what's live and **Phase 6** for the next planned phase (Director Ask Arkim).

## ✅ Shipped — Exception-First Facility-Health Redesign

Direction: the dashboard leads with **"what needs attention"** (real work-order +
maintenance signals), demotes fleet analytics, and only surfaces live sensor data
that the backend can honestly support (value + sparkline; no fabricated
thresholds/baselines/trends).

### Dashboard — exception-first facility health
- **Needs-attention strip** (`NeedsAttention`, `AttentionRow`, `useFacilityHealth`):
  per-asset Critical / Warning / Overdue-WOs / Blind-spot rollup from `/work-orders`
  + `/maintenance-tasks/occurrences` + `/maintenance-tasks/list` (+ equipment list),
  with a tunable severity model and ranking score. Collapses to "all clear" when
  nothing's wrong; gated entirely on real data.
- **Fleet analytics** kept but **demoted** behind a progressive-disclosure toggle;
  rebuilt on **Recharts** (KPI strip + WO-per-asset, WO-status donut, assignee
  workload, WO-source donut).

### Live monitoring (value + sparkline, exception-first)
- `useLiveMonitoring` (batched `/metrics/readings/latest` + paginated
  `/metrics/readings`, grouped by asset→metric), `metricVocabulary`
  (label/unit/kind maps seeded from `ReadingMetrics`, `prettify()` fallback,
  discovery-driven via `/metrics/distinct`).
- **Per-type widgets** (`MetricWidget`): fault → status chip, counter → value+Δ,
  bounded → 0–100% level bar, continuous → sparkline, secondary → muted. No gauges
  (no limits to draw). `Sparkline` (lightweight SVG).
- Dashboard **exception strip** (`LiveMonitoring` + `liveExceptions`): device faults
  + offline sensors only; offline **collapsed to one row per asset**; no noisy
  "movers" without baselines.

### Monitoring page — widget-grid default + drill-down
- **Default** = `AssetLiveGrid` of every streaming asset (per-type widgets); the
  analyst multiselect/timeframe remains as the power path.
- **Click → time-series drill-down**, instant via shared `useLiveMonitoring` data
  (seeded readings); **type-aware drill targets**: `FaultHistory`
  (gap-aware fault timeline, active-vs-stale), `RateBars` (counter rate per
  Hour/Day/Month bucket), bounded 0–100 line, continuous line. **Type-aware
  loading skeletons.** Cross-page pre-filter via `location.state`.

### Design system consistency (global)
- Unified work-order **status tokens** (`--st-open/-progress/-done/-cancel/-overdue`)
  applied app-wide (badges, WO page, calendar, charts). Sharp **3px radius**,
  **near-black** dark theme, **warm-cream** light theme, single **steel-blue accent**.
- Sidebar: blue selected + gray hover; **Ask Arkim** blue launcher; **`ArkimLoader`**
  branded indeterminate loader used for the facility-switch transition.

### Multi-facility & production readiness
- **Site-switch re-scoping** verified (assets, work orders, live monitoring all key
  off `currentSite`); **transient-stale fix** (clear `assets` on `fetchAssets`, show
  `ArkimLoader` during `isLoadingAssets`).
- **Discovery-driven vocabulary** renders facility-specific metrics; per-facility
  mapping table flagged for when real `/distinct` output is available.
- **Demo scaffolding** (`demoData`, fake login, seeded readings) gated behind
  `import.meta.env.DEV && VITE_DEMO_MODE` → statically dead-coded / tree-shaken out
  of production builds. `.env` is git-ignored, so the flag never ships.

## 📊 Current State vs Target State

### Current Architecture

- **Framework**: React 19 with TypeScript
- **UI Library**: Material-UI (@mui/material)
- **Styling**: Tailwind CSS + Material-UI styles
- **Navigation**: React Router with tab-based dashboard
- **State Management**: React Context (Auth, Theme, Messenger)
- **Charts**: Recharts
- **API**: Axios-based services
- **Authentication**: Custom JWT implementation

### Target Architecture (Based on Vercel Example)

- **Framework**: React 19 with TypeScript (maintain)
- **UI Library**: shadcn/ui + Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **Navigation**: Sidebar-based navigation with React Router
- **State Management**: React Context + Enhanced state patterns
- **Charts**: Recharts with advanced customizations
- **Forms**: React Hook Form + Zod validation
- **Theming**: CSS custom properties with theme provider

## 🏗️ Detailed Implementation Phases

### Phase 1: Foundation & Dependencies Setup

#### 1.1 Dependencies Installation

```bash
# Core UI Dependencies
npm install @radix-ui/react-* lucide-react class-variance-authority clsx tailwind-merge

# Form & Validation
npm install react-hook-form @hookform/resolvers zod

# Additional UI Components
npm install cmdk sonner vaul date-fns

# Chart enhancements
npm install recharts@latest

# Development tools
npm install -D @types/node
```

#### 1.2 Project Structure Updates

Maintain the current folder structure or as close as possible to it

#### 1.3 Configuration Files

- Update `tailwind.config.js` with shadcn/ui theme configuration
- Create `components.json` for shadcn/ui CLI
- Update CSS custom properties for theming

#### 1.4 shadcn/ui Setup

```bash
# Initialize shadcn/ui
npx shadcn-ui@latest init

# Install required components
npx shadcn-ui@latest add button card input select dialog table tabs tooltip sidebar
```

### Phase 2: Core UI Components Migration

**Goal**: Replace Material-UI components with shadcn/ui components systematically, maintaining existing functionality and UX while modernizing the visual design. Do not create new components, only update the components in place with the different base implementation!

**Strategy**: Top-down migration approach - Layout → Pages → Components → Internal Components

#### 2.1 Migration Roadmap

**Priority 1: Layout & Infrastructure**

- [ ] `src/pages/MainLayout.tsx` - Main application layout
- [ ] `src/App.tsx` - Application routing structure
- [ ] `src/components/theme-provider.tsx` - Theme system integration

**Priority 2: Authentication Pages**

- [ ] `src/pages/auth/SignIn.tsx` - Login form
- [ ] `src/pages/auth/SignUp.tsx` - Registration form

**Priority 3: Main Pages**

- [ ] `src/pages/Dashboard.tsx` - Primary dashboard
- [ ] `src/pages/UserManagement.tsx` - User management
- [ ] `src/pages/LocationManagement.tsx` - Location management
- [ ] `src/pages/EquipmentManagement.tsx` - Equipment management
- [ ] `src/pages/CompanyManagement.tsx` - Company settings
- [ ] `src/pages/ApiKeyManagement.tsx` - API key management
- [ ] `src/pages/ReadingsReport.tsx` - Reports and analytics

**Priority 4: Component Groups**

- [ ] Layout components (`src/components/layout/`)
- [ ] Dashboard components (`src/components/dashboard/`)
- [ ] Form components (`src/components/ui/`)
- [ ] User management components (`src/components/users/`)
- [ ] Location components (`src/components/locations/`)
- [ ] Equipment components (`src/components/equipment/`)

**Priority 5: Utility Components**

- [ ] Common UI components
- [ ] Analytics components
- [ ] Specialized form inputs

#### 2.2 Migration Status Tracking

**Phase 2.1: Layout Infrastructure** (READY TO START)

Let's begin with the core layout structure:

**Step 1**: `MainLayout.tsx` - Convert Material-UI layout to shadcn/ui sidebar layout ✅

- Replace Material-UI Drawer with shadcn/ui Sidebar
- Convert AppBar to custom header with shadcn/ui components
- Update navigation structure to match Vercel design

**Expected Changes**:

- Material-UI `Drawer` → shadcn/ui `Sidebar`
- Material-UI `AppBar` → Custom header with `Button`, `Avatar`, `DropdownMenu`
- Material-UI `List`/`ListItem` → `SidebarMenu`/`SidebarMenuItem`
- Material-UI `Typography` → HTML elements with Tailwind classes

**COMPLETED**:

- ✅ MainLayout.tsx migrated from Material-UI Box/CssBaseline to divs with Tailwind
- ✅ TopNavBar.tsx migrated from Material-UI AppBar/Toolbar to shadcn/ui Button/Avatar with proper layout
- ✅ SideMenu.tsx migrated from Material-UI Drawer/List to shadcn/ui Sheet/Button components
- ✅ Added ThemeToggle component with Light/Dark/System options, proper icon switching, and backend API integration
- ✅ Updated ThemeContext to support system theme detection and localStorage persistence
- ✅ Fixed all imports to use relative paths for compatibility
- ✅ Updated type definitions to support new "system" theme option

**Next Step**: Continue with authentication pages or main dashboard pages

### Phase 3: Dashboard Architecture Redesign

#### 3.1 Navigation System Transformation

**Current**: Tab-based navigation in `Dashboard.tsx`

```tsx
// OLD: Material-UI Tabs
<Tabs
	value={activeTab}
	onChange={handleTabChange}
>
	<Tab label="Overview" />
	<Tab label="Equipment" />
</Tabs>
```

**Target**: Sidebar navigation with routing

```tsx
// NEW: Sidebar with React Router
<Sidebar>
	<SidebarContent>
		<SidebarMenu>
			<SidebarMenuItem>
				<SidebarMenuButton onClick={() => navigate("/dashboard/overview")}>
					<BarChart3 className="h-4 w-4" />
					Overview
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarMenu>
	</SidebarContent>
</Sidebar>
```

#### 3.2 Dashboard Sections Implementation

**Overview Dashboard** (`src/pages/Dashboard.tsx`)

- Equipment Health Score widget
- Sensor Insights with real-time data
- Energy Usage Summary
- Equipment Status cards
- Equipment Cycle Tracking

**Equipment Management** (`src/pages/EquipmentManagement.tsx`)

- Enhanced equipment list with advanced filtering
- Equipment detail modals
- Add/Edit equipment workflows
- Equipment onboarding process

**Maintenance System** (New: `src/pages/MaintenanceManagement.tsx`)

- Maintenance calendar view
- Task scheduling and assignment
- Predictive maintenance recommendations
- Service provider management

**Data Logs & Reports** (`src/pages/ReadingsReport.tsx` - Enhanced)

- Historical data visualization
- Report generation interface
- Export functionality (PDF, Excel, CSV)
- Custom date range selection

#### 3.3 Component Architecture Pattern

**Base Component Structure**:

```tsx
// Component file structure
"use client"; // For Next.js compatibility hints

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shadcn/card";
import { Button } from "@/components/ui/shadcn/button";
// ... other imports

interface ComponentProps {
	// Define clear prop interfaces
}

export function ComponentName({ ...props }: ComponentProps) {
	// Component logic
	return (
		<Card>
			<CardHeader>
				<CardTitle>Component Title</CardTitle>
			</CardHeader>
			<CardContent>{/* Component content */}</CardContent>
		</Card>
	);
}
```

### Phase 4: Advanced Features Implementation

#### 4.1 Equipment Health Monitoring

**Key Features**:

- Real-time sensor data visualization
- Predictive analytics with trend lines
- Anomaly detection and alerts
- Equipment lifespan predictions
- Maintenance impact tracking

**Implementation Hints**:

```tsx
// Use Recharts with custom tooltips and reference lines
<ResponsiveContainer
	width="100%"
	height={400}
>
	<LineChart data={data}>
		<XAxis dataKey="date" />
		<YAxis />
		<Tooltip content={<CustomTooltip />} />
		<Line
			dataKey="healthScore"
			stroke="#8884d8"
		/>
		<ReferenceLine
			y={80}
			stroke="red"
			strokeDasharray="5 5"
		/>
	</LineChart>
</ResponsiveContainer>
```

#### 4.2 Maintenance System

**Features**:

- Calendar-based maintenance scheduling
- Task assignment and tracking
- Service provider integration
- Cost tracking and budgeting
- Automated maintenance recommendations

**Data Structure**:

```typescript
interface MaintenanceEvent {
	id: string;
	equipmentId: string;
	date: string;
	type: "preventive" | "corrective" | "emergency";
	description: string;
	assignedStaff: string;
	cost: number;
	status: "scheduled" | "in-progress" | "completed";
	priority: "low" | "medium" | "high";
}
```

#### 4.3 Reporting & Analytics

**Report Types**:

- Equipment Performance Reports
- Trend Analysis Reports
- Maintenance Activity Summaries
- Alert and Incident Reports
- Executive Summaries

**Implementation Pattern**:

```tsx
// Report generation with options
const generateReport = async (type: ReportType, options: ReportOptions) => {
	const data = await fetchReportData(type, options);
	return await formatReport(data, options.format); // PDF, Excel, CSV
};
```

### Phase 5: Integration & Performance

#### 5.1 API Integration Updates

**Current API Pattern**:

```typescript
// Existing service pattern
export const dashboardService = {
	getLocationData: async (locationId: string) => {
		// API call implementation
	},
};
```

**Enhanced Pattern with Error Handling**:

```typescript
// Enhanced service with better error handling and typing
export const equipmentService = {
	getEquipmentHealth: async (equipmentId: string): Promise<EquipmentHealth> => {
		try {
			const response = await api.get(`/equipment/${equipmentId}/health`);
			return response.data;
		} catch (error) {
			throw new APIError("Failed to fetch equipment health", error);
		}
	},
};
```

#### 5.2 Performance Optimization

**Strategies**:

- Implement React.memo for heavy components
- Use useMemo for expensive calculations
- Implement virtual scrolling for large datasets
- Add loading skeletons for better UX
- Optimize bundle size with code splitting

**Example**:

```tsx
// Memoized component for performance
const EquipmentCard = React.memo(({ equipment }: { equipment: Equipment }) => {
	const healthScore = useMemo(() => calculateHealthScore(equipment.sensors), [equipment.sensors]);

	return <Card>{/* Component content */}</Card>;
});
```

### Phase 6: Director "Ask Arkim" Assistant (PLANNED — next phase)

**Goal**: Turn the in-app **Ask Arkim** copilot from a scaffold into a grounded,
context-aware assistant for the **director-of-engineering / desk** persona — one
that reads the facility's real data and acts on it, not a generic chat box.

**Current state (audit)**: the side-panel chat exists and looks right (overlay,
not reflow; speech-to-text; copy; scroll-to-bottom), but `postMessage` returns a
**canned dummy reply** — there's no backend, no streaming, no context. The
`ChatInput` also carries accidental complexity (dual `<input>`/`<textarea>` with a
mirror span) worth simplifying.

**Scope (priority order)**:
1. **Wire the real API with streaming** — replace the dummy `postMessage` with the
   chat endpoint; add thinking / loading / stop states. (Blocked on the chat
   backend — confirm endpoint.)
2. **Context-awareness (the differentiator)** — pass the current page + selection
   (asset / work order / filters); swap suggested prompts per page; show a
   "Viewing <page>" context chip. An assistant docked in the app should know where
   you are.
3. **Grounded, actionable answers** — a `{ text, card?, go? }` contract: inline data
   cards (asset + readings/WO summary) and **deep-link actions** (e.g. "Open these
   overdue work orders", "Draft a work order"), reusing the existing nav/pre-filter
   plumbing (`location.state` → Monitoring / Work Orders).
4. **Accessibility** — focus-trap the panel, **Esc** to close, move focus to the
   input on open, label icon-only buttons; add a **⌘K / ⌘J** shortcut.
5. **Simplify `ChatInput`** to a single auto-growing textarea.
6. **Persistence / threads** — survive reload; add new-chat + history.

**Director framing**: lead with the same exception-first questions the dashboard
answers — "summarize what needs attention today", "which assets are overdue and on
which work orders", "what changed since yesterday" — grounded in real WO/PM/sensor
data with a one-click path to act. Sensor-predictive prompts ("trending toward a
limit") stay gated until per-asset baselines exist (consistent with the dashboard).

**Done when**: clicking between Work Orders / Dashboard / Ask Arkim feels like one
product; answers cite real data and offer an action; works in light + dark; a11y
pass clean; no dummy responses.

## 🔧 Migration Execution Strategy

### Step-by-Step Implementation

#### Week 1: Foundation

1. **Day 1-2**: Install dependencies and configure shadcn/ui
2. **Day 3-4**: Create basic UI components and layout structure
3. **Day 5**: Implement new sidebar navigation

#### Week 2: Core Features

1. **Day 1-2**: Migrate dashboard overview with new components
2. **Day 3-4**: Implement equipment health monitoring
3. **Day 5**: Add sensor insights and energy usage components

#### Week 3: Advanced Features

1. **Day 1-2**: Build maintenance system and calendar
2. **Day 3-4**: Implement reporting and analytics
3. **Day 5**: Polish, testing, and optimization

### Migration Checklist

#### Pre-Migration

- [ ] Backup current codebase
- [ ] Document current functionality
- [ ] Set up development branch
- [ ] Install required dependencies

#### During Migration

- [ ] Maintain existing API endpoints
- [ ] Keep authentication system intact
- [ ] Preserve existing routing structure
- [ ] Maintain internationalization support

#### Post-Migration

- [ ] Update tests for new components
- [ ] Performance testing and optimization
- [ ] Cross-browser compatibility testing
- [ ] User acceptance testing

## 🎨 Design System Guidelines

### Color Palette

Based on the Vercel example, implement CSS custom properties:

```css
:root {
	--background: 0 0% 100%;
	--foreground: 222.2 84% 4.9%;
	--primary: 222.2 47.4% 11.2%;
	--secondary: 210 40% 96%;
	/* ... additional colors */
}

[data-theme="dark"] {
	--background: 222.2 84% 4.9%;
	--foreground: 210 40% 98%;
	/* ... dark theme colors */
}
```

### Component Variants

Use `class-variance-authority` for consistent component variants:

```tsx
const buttonVariants = cva("inline-flex items-center justify-center rounded-md text-sm font-medium", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:bg-primary/90",
			destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
			outline: "border border-input hover:bg-accent hover:text-accent-foreground",
		},
		size: {
			default: "h-10 px-4 py-2",
			sm: "h-9 rounded-md px-3",
			lg: "h-11 rounded-md px-8",
		},
	},
	defaultVariants: {
		variant: "default",
		size: "default",
	},
});
```

## 🚨 Common Pitfalls & Solutions

### 1. Component Migration Issues

**Problem**: Material-UI components have different prop interfaces
**Solution**: Create adapter components during transition period

### 2. Styling Conflicts

**Problem**: Tailwind classes conflicting with Material-UI styles
**Solution**: Use CSS modules or styled-components for complex cases

### 3. State Management

**Problem**: Complex state updates with new component structure
**Solution**: Implement useReducer for complex state, maintain Context providers

### 4. Performance Issues

**Problem**: Re-renders with complex dashboard widgets
**Solution**: Use React.memo, useMemo, and useCallback strategically

## 📚 Key Resources

### Documentation

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Recharts](https://recharts.org/)

### Code Examples

- Reference implementation: `vercel_files/` folder
- Component patterns: `vercel_files/components/`
- Layout structure: `vercel_files/app/layout.tsx`

## 🎯 Success Metrics

### Technical Metrics

- [ ] Bundle size reduction by 20%
- [ ] First contentful paint < 1.5s
- [ ] Component test coverage > 80%
- [ ] Zero TypeScript errors

### User Experience Metrics

- [ ] Mobile responsiveness on all devices
- [ ] Accessibility compliance (WCAG 2.1)
- [ ] Dark/light theme support
- [ ] Intuitive navigation flow

### Feature Completeness

- [ ] All existing features preserved
- [ ] New dashboard widgets implemented
- [ ] Maintenance system functional
- [ ] Reporting system operational
- [ ] Real-time data updates working

---

**Last Updated**: June 3, 2026
**Document Version**: 2.0 — exception-first facility-health direction + Phase 6 (Director Ask Arkim)
**Next Review**: Phase 6 kickoff (Ask Arkim backend confirmation)
