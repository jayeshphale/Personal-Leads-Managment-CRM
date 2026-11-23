# LeadFlow CRM — Personal Lead & Course Enrollment Management

A production-ready, single-user Personal Lead Management CRM designed for managing candidate journeys from initial lead acquisition to final course enrollment.

Built with **React**, **Vite**, **TypeScript**, **Tailwind CSS v4**, **Supabase PostgreSQL & Auth**, **TanStack Query**, **Recharts**, **date-fns**, and **PapaParse**.

---

## 🚀 Key Highlights & Modules

### 1. Single-User Owner Portal & RLS Security
- **Strict Row Level Security (RLS)** enabled across all 9 PostgreSQL tables.
- No public user registration: only the authorized CRM owner can log in and view/manage candidate records.
- Database-level composite foreign keys `(lead_id, owner_id) REFERENCES leads(id, owner_id)` mathematically guarantee ownership consistency between parent and child records.

### 2. Interactive Analytics Dashboard
- **Real-time KPI metrics**: Total Leads, New Leads, Interested Leads, Calls Connected, WhatsApp Replied, Workshop Enrolled, Workshop Attended, Closing Calls Completed, Total Enrollments, and Total Revenue.
- **Lead Conversion Funnel**: Visual drop-off and conversion rates through the candidate lifecycle.
- **Daily Calling Activity**: Recharts bar chart tracking attempted vs. connected calls.
- **Workshop Conversion**: Attendance conversion statistics for masterclass sessions.
- **Package Distribution**: Real-time revenue and enrollment breakdown across **Standard**, **Prime**, **Infinity**, and **Legacy** packages.
- **Dynamic Date Filters**: Today, Last 7 Days, Last 30 Days, This Month, and Custom Date Range.

### 3. Comprehensive Lead Management
- Complete CRUD operations (Add, Edit, Delete with permanent confirmation dialog).
- Multi-field search by candidate name, primary phone, or active calling line.
- Filters: City, Qualification, Interest Status, Call Status, and Lead Source.
- Sortable columns (Date, Name, Follow-up date).
- Multi-select checkbox with **Bulk Status Updates** (Calling, WhatsApp, Interest).
- Filtered CSV Export.

### 4. 12-Step CSV Import Wizard
- Built with **PapaParse**.
- Step-by-step file upload, header parsing, column mapping, and field validation.
- Automatically validates mandatory fields (First Name, Phone).
- In-memory duplicate phone number detection against existing database records.
- Option to safely skip duplicates.
- Progress bar and batch insert with full initial audit logs.

### 5. Candidate Profile (360° Candidate Journey)
- **Section A: Personal Information** (Name, Phone, Alternate Phone, Active Calling Line, Age, City, Qualification, Occupation, Lead Source, Notes).
- **Section B: Calling Tracking** (Quick device `tel:` dialing, outcome logging, next follow-up scheduling).
- **Section C: WhatsApp Tracking** (Click-to-chat links, prefilled message templates, manually confirmed Sent/Replied status).
- **Section D: Workshop Attendance** (Multi-workshop registration, attendance tracking: Pending, Attended, Absent).
- **Section E: Closing Call** (Milestones: Not Scheduled, Scheduled, Completed, Follow-up Required).
- **Section F: Course Enrollment** (Package tier: Standard, Prime, Infinity, Legacy; payment status: Pending, Partial, Paid, Refunded; historical non-destructive enrollments).
- **Section G: Chronological Activity Timeline** (Audit log of every change, old vs new values, timestamps, and notes).

### 6. Calling & WhatsApp Trackers
- Dedicated workspaces for day-to-day outbound communication.
- Instant device dial links and click-to-chat WhatsApp actions.
- Today's callback reminders filter.

### 7. Follow-up Reminders Module
- Views: Today, Overdue, Upcoming, Completed, and All Reminders.
- Actions: Complete, Reschedule, Edit, and Cancel.
- In-app notification bell with overdue indicators and browser desktop alerts support (`Notification` API).

### 8. Course Enrollments & Packages
- Package-wise revenue and student counts.
- Payment collection status tracking.
- Automated owner provisioning of the 4 packages: **Standard**, **Prime**, **Infinity**, and **Legacy**.

---

## 📦 Tech Stack

- **Frontend**: React 19, Vite 8, TypeScript 5.8
- **Styling**: Tailwind CSS v4, Lucide React icons
- **State & Data Fetching**: TanStack Query (React Query)
- **Forms & Validation**: React Hook Form, Zod
- **Backend & Database**: Supabase PostgreSQL with RLS & Triggers
- **Charts**: Recharts
- **Date Handling**: date-fns
- **CSV Processing**: PapaParse
- **Deployment**: Vercel SPA (`vercel.json`)

---

## 🛠️ Supabase Setup & Database Migration

### 1. Create a Supabase Project
1. Log in to your [Supabase Dashboard](https://supabase.com).
2. Create a new project (e.g., `personal-lead-crm`).

### 2. Run the SQL Migration
1. Go to the **SQL Editor** tab in your Supabase dashboard.
2. Open `supabase/migrations/20261123000000_init_lead_crm.sql`.
3. Paste the contents into the SQL Editor and click **Run**.
4. This script sets up:
   - All 9 tables (`profiles`, `packages`, `lead_sources`, `leads`, `lead_activities`, `reminders`, `workshops`, `workshop_registrations`, `course_enrollments`).
   - Composite foreign keys for database-level ownership consistency.
   - Row Level Security (RLS) policies on every table (`auth.uid() = owner_id`).
   - Automated triggers for new user sign-up provisioning (creates profile, 4 default packages, and lead sources).
   - Performance indexes on phone numbers, dates, statuses, and foreign keys.

### 3. Create the Owner User in Supabase Auth
1. In your Supabase Dashboard, go to **Authentication** > **Users**.
2. Click **Add User** > **Create User**.
3. Enter your owner email and password (e.g. `owner@crm.com`).
4. (Optional) Disable "Allow new users to sign up" under **Auth Settings** > **User Signups** to ensure only you have access.

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev

# 3. Test production build
npm run build
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🚢 Vercel Deployment

1. Push your repository to GitHub.
2. In [Vercel](https://vercel.com), click **Add New Project** and import the repository.
3. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL.
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
4. Deploy! The included `vercel.json` ensures all client-side routes (SPA) redirect cleanly to `/index.html`.

---

## 📄 License
MIT. Built for single-user personal lead management.
