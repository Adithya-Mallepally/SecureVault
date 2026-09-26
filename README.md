# SecureVault 🔐
### Zero Trust REST API with Role-Based Access Control

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green?style=flat-square&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-NoSQL-47A248?style=flat-square&logo=mongodb)
![Docker](https://img.shields.io/badge/Docker-Containerised-blue?style=flat-square&logo=docker)
![JWT](https://img.shields.io/badge/JWT-Auth-orange?style=flat-square)

---

## Overview

SecureVault is a **production-grade secure REST API** built on Zero Trust principles. It implements JWT-based authentication, fine-grained Role-Based Access Control (RBAC), rate limiting, request validation, and comprehensive audit logging — serving as a reusable secure API foundation for any application.

This project demonstrates applied cybersecurity engineering: threat modelling, secure-by-default API design, and defence-in-depth middleware architecture.

---

## Security Architecture

```
Incoming Request
      │
      ▼
┌─────────────────┐
│  Rate Limiter   │  ← Blocks brute force & DDoS
└────────┬────────┘
         │
┌────────▼────────┐
│  JWT Validator  │  ← Verifies token signature & expiry
└────────┬────────┘
         │
┌────────▼────────┐
│  RBAC Enforcer  │  ← Checks role permissions per route
└────────┬────────┘
         │
┌────────▼────────┐
│ Input Validator │  ← Sanitises & validates request body
└────────┬────────┘
         │
┌────────▼────────┐
│  Route Handler  │  ← Business logic (least privilege)
└────────┬────────┘
         │
┌────────▼────────┐
│  Audit Logger   │  ← Logs every access decision
└─────────────────┘
```

---

## Features

- ✅ JWT access tokens + refresh token rotation
- ✅ Fine-grained RBAC (admin, manager, user, guest)
- ✅ Rate limiting per IP and per user
- ✅ Input validation & sanitisation (Zod schemas)
- ✅ Helmet.js security headers
- ✅ Full audit log (who accessed what, when, from where)
- ✅ Password hashing with bcrypt (cost factor 12)
- ✅ Dockerised for portable deployment
- ✅ Postman collection included
- ✅ 100% TypeScript — full type safety

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript 5.x |
| Runtime | Node.js 20 |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken), bcrypt |
| Validation | Zod |
| Security | Helmet.js, express-rate-limit |
| Logging | Winston |
| Containerisation | Docker |

---

## Project Structure

```
SecureVault/
├── src/
│   ├── config/
│   │   ├── db.ts               # MongoDB connection
│   │   └── env.ts              # Environment variable validation
│   ├── middleware/
│   │   ├── auth.middleware.ts  # JWT verification
│   │   ├── rbac.middleware.ts  # Role-based access control
│   │   ├── rate-limit.ts       # Rate limiting config
│   │   ├── validate.ts         # Zod request validation
│   │   └── audit.ts            # Audit log middleware
│   ├── models/
│   │   ├── user.model.ts       # User schema (hashed pw, role)
│   │   ├── token.model.ts      # Refresh token store
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
│   │   ├── auth.schema.ts      # Zod schemas for auth payloads
│   │   └── user.schema.ts      # Zod schemas for user operations
│   ├── utils/
│   │   ├── jwt.ts              # Token generation & verification
│   │   ├── hash.ts             # bcrypt helpers
│   │   └── logger.ts           # Winston logger setup
│   └── app.ts                  # Express app bootstrap
├── tests/
│   ├── auth.test.ts
│   ├── rbac.test.ts
│   └── rate-limit.test.ts
├── postman/
│   └── SecureVault.postman_collection.json
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── tsconfig.json
└── README.md
```

---

## Getting Started

```bash
git clone https://github.com/Adithya-Mallepally/SecureVault.git
cd SecureVault
cp .env.example .env          # Fill in your secrets
docker-compose up --build
```

API runs at `http://localhost:4000`

---

## API Reference

### Auth Endpoints

| Method | Route | Description | Auth Required |
|---|---|---|---|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login, receive JWT | No |
| POST | `/auth/refresh` | Refresh access token | Refresh token |
| POST | `/auth/logout` | Invalidate refresh token | Yes |

### User Endpoints (RBAC Protected)

| Method | Route | Roles Allowed | Description |
|---|---|---|---|
| GET | `/users/me` | All | Get own profile |
| GET | `/users` | admin, manager | List all users |
| PATCH | `/users/:id` | admin | Update user |
| DELETE | `/users/:id` | admin | Delete user |

### Admin Endpoints

| Method | Route | Roles Allowed | Description |
|---|---|---|---|
| GET | `/admin/audit-log` | admin | Full audit trail |
| GET | `/admin/stats` | admin | System statistics |

---

## RBAC Permission Matrix

| Permission | guest | user | manager | admin |
|---|:---:|:---:|:---:|:---:|
| View own profile | ✅ | ✅ | ✅ | ✅ |
| View all users | ❌ | ❌ | ✅ | ✅ |
| Edit any user | ❌ | ❌ | ❌ | ✅ |
| Delete user | ❌ | ❌ | ❌ | ✅ |
| View audit log | ❌ | ❌ | ❌ | ✅ |

---

## Security Decisions

| Decision | Reasoning |
|---|---|
| Short-lived JWTs (15 min) | Limits blast radius of stolen tokens |
| Refresh token rotation | Detects token theft via reuse detection |
| bcrypt cost factor 12 | Balances security vs performance at scale |
| Rate limit per IP + user | Prevents brute force & credential stuffing |
| Zod validation before handler | Prevents injection via malformed payloads |
| Helmet.js headers | Mitigates common web vulnerabilities (XSS, clickjacking) |

---

## Future Work

- [ ] OAuth2 / OIDC integration
- [ ] Two-factor authentication (TOTP)
- [ ] API key management for service-to-service auth
- [ ] Anomaly detection on audit logs

---

## Author

**Roopadithya Vardhan Mallepally**
M.Sc. Software Engineering — BTH Sweden
[GitHub](https://github.com/Adithya-Mallepally) · [LinkedIn](https://linkedin.com/in/roopadithya)
