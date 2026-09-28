# SecureVault
### Zero Trust REST API with Role-Based Access Control and Adaptive Risk Scoring

---

## Overview

SecureVault is an enterprise-grade secure REST API built on Zero Trust principles. It combines strict JWT-based authentication, fine-grained Role-Based Access Control (RBAC), context-aware adaptive risk evaluation, OWASP-recommended security headers, rate limiting, and comprehensive audit logging into a production-ready application framework.

---

## Unique Key Feature: Contextual Adaptive Risk Evaluation Engine

While conventional APIs rely solely on static role tokens, SecureVault enforces continuous authentication through an Adaptive Zero Trust Risk Engine:
- Dynamic Request Scoring: Every incoming HTTP request is evaluated on a 0-100 risk scale by analyzing client heuristics (e.g., scripted CLI clients), endpoint privilege level, body payload entropy, and injection patterns.
- Automated Step-Up Verification: Critical administrative routes automatically block or require step-up verification whenever a request's risk score breaches the configured threshold.
- Transparent Telemetry: Every response emits `X-Risk-Score` and `X-Risk-Tier` diagnostic headers for real-time observability.

---

## Security Architecture

```
Incoming Request
      |
      v
+-----------------+
|  Rate Limiter   |  Blocks brute force & DDoS attacks
+--------+--------+
         |
+--------v--------+
|   Risk Engine   |  Calculates real-time risk score (0-100) & step-up trigger
+--------+--------+
         |
+--------v--------+
|  JWT Validator  |  Verifies token signature, expiry, and payload claims
+--------+--------+
         |
+--------v--------+
|  RBAC Enforcer  |  Enforces role hierarchy (guest, user, manager, admin)
+--------+--------+
         |
+--------v--------+
| Input Validator |  Zod schemas sanitize and validate request body
+--------+--------+
         |
+--------v--------+
|  Route Handler  |  Executes least-privilege business logic
+--------+--------+
         |
+--------v--------+
|  Audit Logger   |  Records every access decision to persistent storage
+-----------------+
```

---

## Features

- JWT access tokens (15m expiry) with refresh token rotation (7d expiry)
- Hierarchical Role-Based Access Control (guest, user, manager, admin)
- Adaptive contextual risk evaluation engine with dynamic scoring
- Per-IP and per-user sliding window rate limiting
- Input validation and sanitization using Zod schemas
- Helmet security headers and strict Content Security Policy
- Structured audit log capturing caller IP, endpoint, status, and duration
- Cryptographic password hashing using bcrypt with cost factor 12
- Containerized deployment ready for Docker and Docker Compose
- Fully typed TypeScript codebase with 100% test coverage across security layers

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript 5.x |
| Runtime | Node.js 20 |
| Framework | Express |
| Database | MongoDB, Mongoose |
| Authentication | JWT (jsonwebtoken), bcryptjs |
| Validation | Zod |
| Security | Helmet, express-rate-limit, Risk Engine |
| Logging | Winston |
| Testing | Jest, Supertest, ts-jest |

---

## Project Structure

```
SecureVault/
├── src/
│   ├── config/
│   │   ├── db.ts               # Resilient MongoDB connection
│   │   └── env.ts              # Zod environment variable validation
│   ├── middleware/
│   │   ├── auth.middleware.ts  # JWT verification
│   │   ├── rbac.middleware.ts  # Role-based access control
│   │   ├── rate-limit.ts       # Rate limiting configuration
│   │   ├── risk-engine.ts      # Contextual adaptive risk scoring engine
│   │   ├── validate.ts         # Zod request validation
│   │   └── audit.ts            # Audit logging middleware
│   ├── models/
│   │   ├── user.model.ts       # User schema with roles and hashes
│   │   ├── token.model.ts      # Refresh token storage
│   │   └── audit.model.ts      # Audit log schema
│   ├── routes/
│   │   ├── auth.routes.ts      # /auth/register, /auth/login, /auth/refresh
│   │   ├── user.routes.ts      # /users (RBAC protected)
│   │   └── admin.routes.ts     # /admin (admin-only)
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   └── admin.controller.ts
│   ├── schemas/
│   │   ├── auth.schema.ts      # Zod validation schemas for auth
│   │   └── user.schema.ts      # Zod validation schemas for users
│   ├── utils/
│   │   ├── jwt.ts              # Token creation and verification
│   │   ├── hash.ts             # bcrypt helpers
│   │   └── logger.ts           # Winston logger setup
│   └── app.ts                  # Express application bootstrap
├── tests/
│   ├── auth.test.ts            # Authentication tests
│   ├── rbac.test.ts            # RBAC tests
│   ├── rate-limit.test.ts      # Security headers & rate limit tests
│   └── risk.test.ts            # Adaptive risk engine tests
├── postman/
│   └── SecureVault.postman_collection.json
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── tsconfig.json
├── package.json
└── README.md
```

---

## RBAC Permission Matrix

| Permission | guest | user | manager | admin |
|---|---|---|---|---|
| View own profile | Allowed | Allowed | Allowed | Allowed |
| View all users | Denied | Denied | Allowed | Allowed |
| Edit any user | Denied | Denied | Denied | Allowed |
| Delete user | Denied | Denied | Denied | Allowed |
| View audit log | Denied | Denied | Denied | Allowed |

---

## Getting Started

### Run with Docker

```bash
docker-compose up --build
```

API runs at http://localhost:4000

### Run Locally

```bash
npm install
npm run build
npm test
npm start
```

---

## Author

Roopadithya Vardhan Mallepally
M.Sc. Software Engineering - BTH Sweden
GitHub: https://github.com/Adithya-Mallepally
