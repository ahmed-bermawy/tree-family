# Family Tree App

A full-stack family tree management application built with **NestJS**, **Prisma**, and **PostgreSQL**.

## 🚀 Live API

Base URL: `http://76.13.60.23:3000`

## 📋 API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register a new user | ❌ |
| POST | `/auth/login` | Login and get JWT token | ❌ |
| GET | `/auth/profile` | Get current user profile | ✅ JWT |

### Trees
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/trees` | Create a family tree | ✅ |
| GET | `/trees` | List user's trees | ✅ |
| GET | `/trees/:id` | Get a tree by ID | ✅ |
| PATCH | `/trees/:id` | Update a tree | ✅ |
| DELETE | `/trees/:id` | Delete a tree | ✅ |
| GET | `/trees/:id/graph` | Get tree graph (nodes + edges) | ✅ |

### Persons
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/persons` | Create a person | ✅ |
| GET | `/persons/tree/:treeId` | List persons in a tree | ✅ |
| GET | `/persons/:id` | Get person by ID | ✅ |
| PATCH | `/persons/:id` | Update a person | ✅ |
| DELETE | `/persons/:id` | Delete a person | ✅ |

### Relationships
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/relationships` | Create a relationship | ✅ |
| DELETE | `/relationships/:id` | Delete a relationship | ✅ |

## 📦 Tech Stack

- **Runtime:** Node.js 22
- **Framework:** NestJS 11 (TypeScript)
- **ORM:** Prisma 5
- **Database:** PostgreSQL 16
- **Auth:** JWT (JSON Web Tokens)
- **Validation:** class-validator + class-transformer
- **Process Manager:** PM2
- **Server:** Ubuntu VPS

## 🧠 Business Rules

- A person belongs to exactly one tree
- Relationships must be within the same tree
- No circular parent-child relationships (cycle detection via BFS)
- A person cannot be their own parent/child/spouse
- Duplicate relationships are prevented

## 🏗️ Project Structure

```
src/
├── auth/           # Auth module (register, login, JWT)
│   ├── dto/
│   ├── guards/
│   └── strategies/
├── common/         # Shared decorators
├── persons/        # Person CRUD
│   └── dto/
├── prisma/         # Prisma service
├── relationships/  # Relationship management
│   └── dto/
├── trees/          # Tree CRUD + graph
│   └── dto/
├── app.module.ts
└── main.ts
```

## 🛠️ Getting Started

```bash
# Clone
git clone https://github.com/ahmed-bermawy/tree-family.git
cd tree-family

# Install
npm install

# Set up .env
echo 'DATABASE_URL="postgresql://user:password@localhost:5432/family_tree_db?schema=public"' > .env

# Build & run
npm run build
npm run start:prod
```
