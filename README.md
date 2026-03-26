<div align="center">
  <img src="public/skylab.svg" alt="SKY LAB Logo" width="80" />
  <h1>SKY LAB Forms</h1>
  <p>
    A comprehensive form builder and management platform built for<br/>
    <strong>Yıldız Technical University - SKY LAB</strong>
  </p>
  <p>
    <a href="https://forms.yildizskylab.com"><img src="https://img.shields.io/badge/Live-yildizskylab.com-7c3aed?style=for-the-badge" alt="Live" /></a>
    <img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  </p>
</div>

<br/>

> Create, manage, and analyze forms with advanced features like conditional logic, drag-and-drop editing, reusable component groups, and detailed response analytics.

<div align="center">
  <br/>
  <img src=".github/assets/admin-preview.gif" alt="SKY LAB Forms Preview" width="800" />
  <br/><br/>
</div>

---

## Features

### Form Builder
- **12 field types** - Short text, long text, toggle, dropdown, multi-choice, date picker, time picker, file upload, link, slider, matrix, separator, and more
- **Drag-and-drop** reordering with smooth animations (dnd-kit)
- **Rich text editor** for form descriptions (TipTap)
- **Conditional logic** - Show or hide fields based on user responses
- **Form linking** - Link fields to other forms for nested submissions
- **Live preview** - See your form as you build it
- **Auto-save drafts** - Editor changes are automatically saved as drafts with debounced caching; restore or discard on next session
- **Undo system** - Debounced history tracking with one-click undo
- **Session auto-fill** - Name and email fields are automatically populated from the user's session

### Reusable Component Groups
- Save commonly used field sets as **reusable templates**
- Import component groups into any form
- Manage and update groups from a dedicated panel

### Response Drafts
- **Auto-save for respondents** - Logged-in users' in-progress responses are automatically saved as drafts
- **Draft restore prompt** - On revisit, saved answers are auto-loaded with an option to discard and start fresh
- **Last saved indicator** - Timestamp shown near the submit button

### Response Management
- View, filter, and search responses with pagination
- **Approval workflow** - Approve, reject, or leave responses pending with notes
- **Archive** responses to keep your workspace clean
- **Export to Excel** for offline analysis
- **File preview** for uploaded attachments

### Admin Dashboard
- At-a-glance statistics: total forms, responses, and component groups
- **Weekly trend charts** for form creation and response activity
- Recent forms with quick-action shortcuts
- Time-of-day greeting for a personal touch

### Form Settings
- Anonymous response collection
- Allow or restrict multiple responses per user
- Enable manual review before acceptance
- Publish / unpublish forms on demand
- SEO metadata (title & description) for shared form links

### Landing Page
- Animated hero section with live statistics (8 teams, 50+ members, 30+ projects)
- **Team showcase** bento grid
- "How We Work" section, FAQ, and scrolling component marquee
- Fully responsive design with Framer Motion animations

### Documentation
- Built-in **"How to Use"** guide with 12 interactive tutorial sections
- Covers form creation, editing, conditional logic, response management, and more

---

## Tech Stack

| Layer              | Technology                                      |
| ------------------ | ----------------------------------------------- |
| **Framework**      | [Next.js 16](https://nextjs.org/) (App Router)  |
| **UI Library**     | [React 19](https://react.dev/)                  |
| **Authentication** | [NextAuth.js v5](https://authjs.dev/) + Keycloak|
| **State / Data**   | [TanStack React Query v5](https://tanstack.com/query) |
| **Styling**        | [Tailwind CSS v4](https://tailwindcss.com/)     |
| **Animations**     | [Framer Motion](https://motion.dev/)            |
| **Rich Text**      | [TipTap](https://tiptap.dev/)                   |
| **Drag & Drop**    | [dnd-kit](https://dndkit.com/)                  |
| **Charts**         | [Recharts](https://recharts.org/)               |
| **Icons**          | [Lucide React](https://lucide.dev/)             |
| **Sanitization**   | [DOMPurify](https://github.com/cure53/DOMPurify)|

---

## Pages & Routes

### Public

| Route      | Description                          |
| ---------- | ------------------------------------ |
| `/`        | Landing page                         |
| `/[id]`    | Fill out a published form            |

### Admin (Protected)

| Route                                        | Description               |
| -------------------------------------------- | ------------------------- |
| `/admin`                                     | Dashboard                 |
| `/admin/forms`                               | All forms list            |
| `/admin/forms/new-form`                      | Create a new form         |
| `/admin/forms/[formId]`                      | Form overview & analytics |
| `/admin/forms/[formId]/edit`                 | Form editor               |
| `/admin/forms/[formId]/responses`            | Response list             |
| `/admin/forms/[formId]/responses/[responseId]` | Response detail        |
| `/admin/component-groups`                    | Component groups list     |
| `/admin/component-groups/new-group`          | Create component group    |
| `/admin/component-groups/[groupId]`          | Group detail              |
| `/admin/how-to-use`                          | Documentation             |

---

## Form Field Types

| #  | Type             | Description                                    |
| -- | ---------------- | ---------------------------------------------- |
| 1  | **Short Text**   | Single-line input with session auto-fill       |
| 2  | **Long Text**    | Multi-line textarea                            |
| 3  | **Toggle**       | Boolean yes/no switch                          |
| 4  | **Combobox**     | Dropdown select with custom option support     |
| 5  | **Multi Choice** | Multiple selection with checkboxes             |
| 6  | **Date Picker**  | Calendar-based date selection                  |
| 7  | **Time Picker**  | Time selection input                           |
| 8  | **File Upload**  | File attachment with size & type restrictions  |
| 9  | **Link**         | URL input with validation                      |
| 10 | **Slider**       | Numeric range selector with min/max/step       |
| 11 | **Matrix**       | Grid/table for survey-style rating questions   |
| 12 | **Separator**    | Section divider with title & description       |

Each field type supports:
- Required / optional validation (except separator)
- Custom placeholder text
- Conditional display logic
- Linking to other forms

---

## Getting Started

### Prerequisites

- **Node.js** 18.17 or later
- **npm**, **yarn**, or **pnpm**
- Access to a **Keycloak** instance (for authentication)
- A running **SKY LAB Forms API** backend

### Installation

```bash
# Clone the repository
git clone https://github.com/skylab-kulubu/forms-frontend.git
cd forms-frontend

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

| Variable                         | Description                              |
| -------------------------------- | ---------------------------------------- |
| `NEXT_PUBLIC_API_URL`            | Backend API base URL                     |
| `NEXT_PUBLIC_KEYCLOAK_ISSUER`    | Keycloak realm URL (public)              |
| `KEYCLOAK_CLIENT_ID`             | OAuth client ID                          |
| `KEYCLOAK_CLIENT_SECRET`         | OAuth client secret                      |
| `KEYCLOAK_ISSUER`                | Keycloak realm URL (server-side)         |
| `AUTH_SECRET`                    | NextAuth encryption secret               |

### Running the App

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

The app will be available at `http://localhost:3000`.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for project structure, architecture details, and contribution guidelines.

---

## License

This project is developed and maintained by **SKY LAB - Yıldız Technical University Computer Science Club**.
