# Asset Monitoring System - Master Data Configuration

## Phase 1 MVP: Functional Requirements

This document outlines the functional requirements for the initial phase of the Asset Monitoring System, focusing on master data configuration capabilities.

## 1. Company Management

### Overview
The system will support multiple companies (multi-tenant), with data isolation between companies. Each user is associated with exactly one company, and their view of the system will be filtered based on this association.

### Functional Requirements

#### 1.1 Company Registration
- Enable company registration during the initial user sign-up process
- Collect company name as well as the user details. Company info can be updated later on by the admin user

#### 1.2 Company Profile Management
- Allow updating of company information after registration
- Editable fields should include:
  - Company name
  - Address details
  - Contact information
  - Timezone settings
  - Default measurement units (metric/imperial)

### User Stories
- As a new user, I want to register my company during sign-up so I can begin using the system
- As a company admin, I want to update company information so our profile remains accurate

## 2. User Management

### Overview
The system will support two primary user roles: Administrators and Monitoring Operators. Each user belongs to a single company and can have only one role within that company.

### Functional Requirements

#### 2.1 User Roles
- **Administrator**:
  - Full access to all system features
  - Can configure master data (companies, users, locations, equipment)
  - Can access monitoring dashboards and historical data
  - Can create and manage users
  
- **Monitoring Operator**:
  - Access to monitoring dashboards
  - Accesses data only for the selected locations
  - Can view real-time and historical data
  - Can view equipment details
  - Cannot modify master data configuration

#### 2.2 User Creation
- Allow company administrators to:
  - Create new user accounts
  - Update existing users: cannot update currently logged-in user (themself). Should be visually highlighted on the users list.
  - Reset the passwords
  - Change admin/non admin types of a user
  - Delete users (except currently logged in)

#### 2.3 User Profile Management
- Enable users to manage their profiles:
  - Update personal information
  - Change passwords
  - Select the theme
  - Log out from the system

#### 2.4 User Authentication
Handled by cognito:
- Secure login with email and password
- Password recovery functionality
- Session management with appropriate timeouts
- Optional: Two-factor authentication

### User Stories
- As a company admin, I want to create user accounts so my team can access the system
- As a company admin, I want to assign appropriate roles to users so they have the right permissions
- As a user, I want to update my profile information so it remains current
- As a company admin, I want to deactivate user accounts when employees leave

## 3. Location Management

### Overview
Companies can have multiple physical locations (branches, warehouses, restaurants, etc.). Equipment is associated with specific locations, and users can have default locations to focus their view. Non admin users are allowed to see the dashboard for assigned locations only

### Functional Requirements

#### 3.1 Location Creation
- Allow administrators to create locations with:
  - Location name
  - Address
  - Notes/description

#### 3.2 Location Assignment
- Associate equipment with specific locations
- Assign default locations to users
- Allow users to switch between locations they have access to

#### 3.3 Location Management
- Enable editing of location details
- Support deactivation of locations without deletion (to preserve historical data)
- Allow location filtering across the application

### User Stories
- As an admin, I want to create locations so I can organize assets by their physical placement
- As an admin, I want to assign default locations to users so they see the most relevant information first
- As a user, I want to filter assets by location so I can focus on specific areas
- As an admin, I want to update location details when they change

## 4. Equipment Management

### Overview
Equipment represents the physical assets being monitored, with a primary focus on cold storage assets. Equipment is associated with locations and can have multiple sensors assigned to it.

### Functional Requirements

#### 4.1 Equipment Creation
- Allow administrators to register equipment with:
  - Name/identifier
  - Type/category
  - Location assignment
  - Manufacturer
  - Model
  - Serial number
  - Installation date
  - Expected maintenance schedule
  - Operating parameters/thresholds

#### 4.2 Equipment Categorization
- Support categorization of equipment by:
  - Type (e.g., refrigerator, freezer, HVAC)
  - Usage (e.g., food storage, medical storage)
  - Criticality (e.g., high, medium, low)

#### 4.3 Sensor Assignment
- Enable the assignment of sensors to equipment
- Capture sensor metadata:
  - Sensor ID/identifier
  - Type (temperature, humidity, power, etc.)
  - Installation location on the equipment
  - Calibration information
  - Expected data ranges

#### 4.4 Equipment Management
- Support updating equipment details
- Allow for equipment deactivation or status changes
- Enable equipment transfer between locations
- Provide equipment history tracking

### User Stories
- As an admin, I want to register new equipment so it can be monitored in the system
- As an admin, I want to assign sensors to equipment so the system can map incoming data
- As an admin, I want to update equipment details when changes occur
- As a user, I want to view equipment details so I can understand its specifications

## Integration Points

### Backend API Requirements
- API endpoints for all CRUD operations on master data entities
- Authentication and authorization controls
- Data validation rules
- Pagination, sorting, and filtering capabilities

## Constraints and Assumptions

### Constraints
- Each user can belong to only one company
- Equipment must be assigned to a location
- Sensors must be associated with equipment for data mapping

### Assumptions
- The backend system will provide necessary APIs for all operations
- Sensor data will be pushed to the backend by external systems
- Equipment and sensor identifiers will be unique within a company
- Basic data validation will occur on both frontend and backend

## Success Criteria
- Administrators can successfully complete all master data configuration
- Users can be created with appropriate roles and permissions
- Equipment can be properly categorized and organized by location
- The system is prepared for the addition of monitoring capabilities in future phases