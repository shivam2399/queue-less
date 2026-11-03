# Database Schema

## 1. Conventions

- MySQL 8 / InnoDB.
- Integer auto-increment primary keys for MVP.
- `created_at`, `updated_at` timestamps.
- Sequelize maps camelCase attributes to snake_case columns.
- Foreign keys use explicit `ON DELETE` behavior.
- Monetary amounts use `DECIMAL(10,2)`.
- Business queue date is a `DATE` in the business's local timezone.

## 2. Tables

### users

| Column | Type | Rules |
|---|---|---|
| id | INT | PK, auto increment |
| name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(150) | NOT NULL, UNIQUE, normalized lowercase |
| password | VARCHAR(255) | NOT NULL, password hash |
| role | ENUM(customer,business_owner,admin) | NOT NULL; public registration only customer/business_owner |
| is_active | BOOLEAN | NOT NULL DEFAULT true |
| created_at | DATETIME | NOT NULL |
| updated_at | DATETIME | NOT NULL |

### businesses

| Column | Type | Rules |
|---|---|---|
| id | INT | PK |
| owner_id | INT | FK users.id, NOT NULL |
| name | VARCHAR(150) | NOT NULL |
| description | TEXT | NULL |
| address | VARCHAR(255) | NOT NULL |
| phone | VARCHAR(20) | NULL |
| opening_time | TIME | NOT NULL |
| closing_time | TIME | NOT NULL |
| timezone | VARCHAR(64) | NOT NULL DEFAULT Asia/Kolkata |
| is_active | BOOLEAN | NOT NULL DEFAULT true |
| created_at / updated_at | DATETIME | NOT NULL |

Index: `(owner_id)`, `(is_active)`.

### services

| Column | Type | Rules |
|---|---|---|
| id | INT | PK |
| business_id | INT | FK businesses.id, NOT NULL |
| name | VARCHAR(150) | NOT NULL |
| description | TEXT | NULL |
| duration_minutes | INT | NOT NULL, >= 5 |
| price | DECIMAL(10,2) | NOT NULL, >= 0 |
| is_active | BOOLEAN | NOT NULL DEFAULT true |
| created_at / updated_at | DATETIME | NOT NULL |

Indexes: `(business_id, is_active)`.

### appointments

| Column | Type | Rules |
|---|---|---|
| id | INT | PK |
| customer_id | INT | FK users.id, NOT NULL |
| business_id | INT | FK businesses.id, NOT NULL |
| service_id | INT | FK services.id, NOT NULL |
| appointment_date | DATE | NOT NULL, business-local queue date |
| appointment_time | TIME | NULL; informational unless slot logic is implemented |
| token_number | INT | NOT NULL |
| status | ENUM(waiting,serving,completed,cancelled,no_show) | NOT NULL |
| estimated_wait_minutes | INT | NULL; snapshot only if needed |
| created_at / updated_at | DATETIME | NOT NULL |

Constraints/indexes:
- UNIQUE `(business_id, appointment_date, token_number)`.
- INDEX `(business_id, appointment_date, status, token_number)`.
- INDEX `(customer_id, appointment_date)`.
- INDEX `(service_id)`.

### business_queues

| Column | Type | Rules |
|---|---|---|
| id | INT | PK |
| business_id | INT | FK businesses.id, NOT NULL |
| queue_date | DATE | NOT NULL |
| current_token | INT | NOT NULL DEFAULT 0 |
| last_token | INT | NOT NULL DEFAULT 0 |
| is_paused | BOOLEAN | NOT NULL DEFAULT false |
| created_at / updated_at | DATETIME | NOT NULL |

Constraint: UNIQUE `(business_id, queue_date)`.

## 3. Relationships

- User 1:N Business (owner).
- Business 1:N Service.
- Business 1:N Appointment.
- User 1:N Appointment (customer).
- Service 1:N Appointment.
- Business 1:N BusinessQueue (one per date).

## 4. Delete behavior

- Do not hard-delete businesses with appointment history. Prefer `is_active=false`.
- Do not hard-delete services referenced by appointments. Prefer `is_active=false`.
- User deletion should be restricted or implemented as a controlled anonymization process.
- Appointment records should be retained for audit/demo history; cancellation is a status transition.
- Use restrictive foreign keys where deleting a parent would destroy business history.

## 5. Important data integrity rules

1. Token number unique within a business/date.
2. Queue row unique within business/date.
3. Appointment service must belong to appointment business; validate in service logic (a composite FK may be added if schema is designed for it).
4. Authenticated customer identity comes from session, not request body.
5. Owner ownership is checked in every mutation/read that exposes private business data.
6. One active `serving` appointment per business/date is enforced by serialized transaction logic.
7. Token allocation and appointment creation happen in one transaction.

## 6. Migrations

Create initial migrations for all tables and indexes. Seed deterministic demo data through seeders. Never use `sync({ alter: true })` in production. If a schema change is needed, add a migration and update this document.
