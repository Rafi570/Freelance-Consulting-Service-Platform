# 🚀 Freelance & Consulting Service Platform - Backend API

A high-performance, enterprise-grade RESTful API backend for a **Freelance Consulting Service Platform**, built with **Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, Cloudinary, Redis, Stripe, and Google OAuth 2.0**.

---

## 🌐 Live Deployment & Links

- 🔗 **Live Backend API (Vercel):** [https://freelance-consulting-service-platform-backend-a7n3l0o46.vercel.app](https://freelance-consulting-service-platform-backend-a7n3l0o46.vercel.app)
- 🔑 **Google Sign-In Interactive Demo:** [https://freelance-consulting-service-platform-backend-a7n3l0o46.vercel.app/test-google](https://freelance-consulting-service-platform-backend-a7n3l0o46.vercel.app/test-google)
- 📦 **GitHub Repository:** [https://github.com/Rafi570/Freelance-Consulting-Service-Platform](https://github.com/Rafi570/Freelance-Consulting-Service-Platform)
- 📁 **Postman Collection:** Included in root directory [`postman_collection.json`](./postman_collection.json)

---

## 🛠 Tech Stack

- **Runtime & Language:** Node.js (v20+), TypeScript
- **Framework:** Express.js 5.x
- **Database & ORM:** PostgreSQL (Neon / Supabase / Aiven), Prisma ORM v6
- **Authentication:** JWT (JSON Web Tokens), Google OAuth 2.0 (`google-auth-library`), Bcrypt
- **File Upload & Storage:** Cloudinary, Multer
- **Payment Processing:** Stripe Payment Gateway
- **Caching & In-Memory Store:** Redis (`ioredis`)
- **Validation:** Zod v4 schema validation
- **Deployment:** Vercel Serverless Functions

---

## 🌟 Key Features

### 1. 🔐 Multi-Role Authentication & Security
- User registration with OTP email verification (`nodemailer` / `resend`).
- Standard email/password login and **Google OAuth 2.0** login with automatic profile provisioning.
- Role-Based Access Control (**SUPER_ADMIN**, **PROVIDER**, **CLIENT**).
- Account status lifecycle (**ACTIVE**, **BLOCKED**, **SUSPENDED**, **DRAFT**).

### 2. 🛡 Provider Support & Block Appeal System
- When a user/provider is blocked, the admin records the explicit `blockReason` and `blockedAt` timestamp.
- Blocked providers can submit unblock appeals via Support Tickets (`/api/v1/support/appeal`).
- Interactive conversation thread between blocked users and support admins.
- Support admin can review and approve valid reasons, which automatically unblocks the provider.

### 3. 🎨 Gig Management with Cloudinary Multi-Image Upload
- Providers can create and manage service gigs with multiple tiers (`BASIC`, `STANDARD`, `PREMIUM`).
- Supports uploading 3–4 images per gig directly via Cloudinary integration or image URL arrays.
- Search, filter by price range, category, status, and pagination with metadata.

### 4. 📦 Order & Contract Workflow
- Clients can order gigs across tiers.
- Lifecycle tracking: `PENDING` ➔ `IN_PROGRESS` ➔ `COMPLETED` / `CANCELLED`.
- Standardized cancellation reason handling (`MUTUAL_AGREEMENT`, `DELAYED_DELIVERY`, etc.).

### 5. 💳 Stripe Payments & Subscriptions
- Checkout sessions for order payments and monthly provider subscriptions.
- Webhooks and status verification (`UNPAID`, `PAID`, `REFUNDED`, `FAILED`).

### 6. ⭐ Reviews & Ratings
- Clients can leave ratings and detailed reviews for completed orders.
- Dynamic calculation of average rating and total sold count for gigs.

---

## 📂 Project Structure

```
├── api/
│   └── index.ts                 # Vercel serverless entrypoint
├── prisma/
│   └── schema.prisma            # PostgreSQL Database Schema
├── src/
│   ├── app/
│   │   ├── config/              # Environment configuration
│   │   ├── errors/              # Global AppError & Error Handlers
│   │   ├── middlewares/         # Auth, Zod validation, Global error handler
│   │   ├── modules/
│   │   │   ├── auth/            # Authentication & Google OAuth
│   │   │   ├── gig/             # Gig creation, search & image upload
│   │   │   ├── order/           # Order management & status
│   │   │   ├── payment/         # Stripe payments & subscriptions
│   │   │   ├── provider/        # Provider profiles & skills
│   │   │   ├── review/          # Ratings & reviews
│   │   │   ├── support/         # Support tickets & block appeals
│   │   │   └── user/            # User profile & admin controls
│   │   ├── routes/              # Centralized route aggregator
│   │   └── utils/               # Cloudinary, SendEmail, CatchAsync
│   ├── app.ts                   # Express application setup
│   └── server.ts                # HTTP Server starter & Prisma connection
├── postman_collection.json      # Comprehensive Postman Test Suite
├── vercel.json                  # Vercel deployment configuration
└── README.md
```

---

## 🔌 API Endpoints Reference

### 🔐 Authentication (`/api/v1/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register new provider/client |
| `POST` | `/api/v1/auth/verify-email` | Verify email with OTP |
| `POST` | `/api/v1/auth/resend-otp` | Resend verification OTP |
| `POST` | `/api/v1/auth/login` | Login with email & password |
| `POST` | `/api/v1/auth/google-login` | Login/Register via Google ID Token |

### 🛠 Support & Appeals (`/api/v1/support`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/support/check-status` | Check user block status & reason by email |
| `POST` | `/api/v1/support/appeal` | Submit unblock appeal for blocked account |
| `GET` | `/api/v1/support/tickets/my-tickets`| View my support tickets & appeals |
| `GET` | `/api/v1/support/tickets/:id` | View ticket details and messages |
| `POST` | `/api/v1/support/tickets/:id/messages` | Send message in ticket thread |
| `GET` | `/api/v1/support/admin/tickets` | Admin view all support tickets |
| `PATCH`| `/api/v1/support/admin/tickets/:id/review` | Admin approve (unblock user) or reject |

### 🎨 Gigs (`/api/v1/gigs`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/gigs` | Create new gig with packages & images |
| `POST` | `/api/v1/gigs/upload-images`| Upload 3-4 images to Cloudinary |
| `GET` | `/api/v1/gigs` | Get all active gigs (Search & Filter) |
| `GET` | `/api/v1/gigs/:id` | Get gig details by ID |
| `GET` | `/api/v1/gigs/my-gigs` | Get provider's own gigs |
| `PATCH`| `/api/v1/gigs/:id` | Update gig information |
| `DELETE`| `/api/v1/gigs/:id` | Delete a gig |

### 📦 Orders (`/api/v1/orders`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/orders` | Place a new order |
| `GET` | `/api/v1/orders` | View user orders |
| `PATCH`| `/api/v1/orders/:id/status` | Update order progress status |
| `PATCH`| `/api/v1/orders/:id/cancel` | Cancel order with reason |

### 💳 Payments (`/api/v1/payments`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/payments/create-checkout-session` | Create Stripe payment session |
| `GET` | `/api/v1/payments/verify/:sessionId` | Verify payment status |

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
NODE_ENV=development
PORT=5001

# Database (PostgreSQL)
DATABASE_URL="postgresql://username:password@hostname:5432/dbname?sslmode=require"

# JWT Security
JWT_SECRET="your_super_secret_jwt_key"
JWT_EXPIRES_IN="7d"
BCRYPT_SALT_ROUNDS=12

# Cloudinary
CLOUDINARY_CLOUD_NAME="dq296qfag"
CLOUDINARY_API_KEY="924775887275442"
CLOUDINARY_API_SECRET="0u-ontmI2MvLUS1nYj8ad6xN07k"

# Google OAuth
GOOGLE_CLIENT_ID="1029695050935-1f0tk8ulr5dq396kf4ll5c36e8ud7k3s.apps.googleusercontent.com"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email Service
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
```

---

## 🚀 Getting Started Locally

### 1. Clone the Repository
```bash
git clone https://github.com/Rafi570/Freelance-Consulting-Service-Platform.git
cd Freelance-Consulting-Service-Platform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Database Schema
```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```
Server runs at `http://localhost:5001`.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
