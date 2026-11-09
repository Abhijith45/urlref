<div align="center">

# 🔗 URLRef

### A fast and modern URL shortener, custom domain manager, and QR code maker.

[![CI Pipeline](https://github.com/Abhijith45/urlref/actions/workflows/ci.yml/badge.svg)](https://github.com/Abhijith45/urlref/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/API%20Tests-98%20Passing-brightgreen?logo=vitest)](https://github.com/Abhijith45/urlref)
[![E2E Smoke](https://img.shields.io/badge/Browser%20Tests-13%20Passing-blue?logo=playwright)](https://github.com/Abhijith45/urlref)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791?logo=postgresql)](https://www.postgresql.org/)

[**Live Web App**](https://urlref.softics.in) • [**API Gateway**](https://apiref.softics.in) • [**Source Code**](https://github.com/Abhijith45/urlref)

</div>

---

## 💡 What is URLRef?

**URLRef** is an easy-to-use link shortener built for individuals, creators, and teams. 

Most link shorteners freeze or slow down when a link gets clicked by thousands of people at once. URLRef fixes this by saving popular links in fast memory so users are redirected in less than 1 millisecond. It also tracks clicks in the background without making visitors wait.

Beyond simple shortening, URLRef lets teams connect their own web addresses (with automatic free SSL security), make custom QR codes, and upload spreadsheets to shorten hundreds of links at once.

---

## ✨ Features You Get

- **⚡ Instant (<1ms) Redirects:** Popular links open immediately because they are held in memory. Visitors never see a blank white waiting screen.
- **🌐 Custom Domains with Free SSL:** Connect your own website address (like `link.mybrand.com`). Security certificates are created and renewed automatically.
- **👥 Team Workspaces & Permissions:** Invite coworkers with different roles (Admin, Member, or Viewer) so everyone has the right level of access.
- **📊 Private Analytics:** View total clicks, top countries, and whether people are on mobile or desktop without collecting personal details or visitor IPs.
- **📦 Bulk CSV Shortener:** Upload a spreadsheet to create up to 1,000 shortened links at once with marketing tags (UTM parameters) included.
- **🎨 Custom QR Code Studio:** Download styled QR codes with your brand colors and center logo for websites, WhatsApp chats, and UPI payments.
- **🛡️ Safe Spreadsheets:** Protects against hidden formulas when exporting click data to Excel or Google Sheets.
- **🤖 Automated Testing:** 98 backend tests and 13 browser tests run automatically to make sure link creation and logins never break.

---

## 🛠️ Tech Stack Made Simple

| Area | Tools Used | Why It Was Chosen |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Material UI | Gives users a clean, fast, and mobile-friendly dashboard. |
| **Backend** | Node.js, Express, TypeScript | Handles link creation and redirects smoothly. |
| **Database** | PostgreSQL 17, Prisma | Safely stores links, teams, and click events without losing data. |
| **Web Server** | Caddy Server | Automatically sets up free HTTPS security certificates for custom domains. |
| **Testing** | Vitest, Supertest, Playwright | Checks that all buttons, forms, and redirects work on phones and computers. |
| **Automation** | GitHub Actions | Tests every code change automatically before it goes live. |

---

## 🚀 How to Run It Locally

### What You Need:
- **Node.js** (version 20 or newer)
- **Docker** (to run the database)
- **Git**

### Step-by-Step Setup:

1. **Download the code:**
   ```bash
   git clone https://github.com/Abhijith45/urlref.git
   cd urlref
   ```

2. **Install all dependencies:**
   ```bash
   npm ci
   ```

3. **Start the local PostgreSQL database:**
   ```bash
   docker compose up -d
   ```

4. **Prepare the database:**
   ```bash
   npx prisma migrate dev --schema=apps/api/prisma/schema.prisma
   ```

5. **Start the development servers:**
   ```bash
   npm run dev
   ```

- **Open the Web Dashboard:** `http://localhost:5173`
- **API Server:** `http://localhost:4000`

---

## 🧪 Running the Tests

You can run the full test suite with these commands:

```bash
# Run all 98 backend API tests
npm run test -w apps/api

# Run all 13 automated browser tests
npx playwright test
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
