# Radlett Lodge No. 6652 Website

Official website for Radlett Lodge No. 6652, a Masonic Lodge under the United Grand Lodge of England.

## Features

- **Public Website**: Information about the Lodge, events, news, and membership
- **Members Area**: Secure access to Lodge documents, meeting minutes, and member directory
- **Admin Dashboard**: Content management system for administrators
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **PWA Support**: Progressive Web App capabilities for mobile installation

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Netlify
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd radlett-lodge-website
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

### Database Setup

The project includes Supabase migrations in the `supabase/migrations/` directory. These will set up:

- Member profiles and authentication
- Lodge documents and meeting minutes
- Events and news management
- Site settings and content management

### Deployment

The site is configured for automatic deployment on Netlify:

1. Connect your GitHub repository to Netlify
2. Set the build command to `npm run build`
3. Set the publish directory to `dist`
4. Add your environment variables in Netlify's dashboard
5. Deploy!

## Environment Variables

Required environment variables for production:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

Optional environment variables:

- `EMAIL_SERVICE_API_KEY`: For contact form functionality
- `EMAIL_SENDER_ADDRESS`: Sender email for contact forms
- `EMAIL_RECIPIENT_ADDRESS`: Recipient email for contact forms

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── contexts/           # React contexts (Auth, etc.)
├── hooks/              # Custom React hooks
├── lib/                # Utilities and API functions
├── types/              # TypeScript type definitions
└── utils/              # Helper functions

supabase/
├── functions/          # Edge functions
└── migrations/         # Database migrations

public/                 # Static assets
```

## Features

### Public Website
- Homepage with Lodge information
- About page with history and officers
- Events calendar
- News and updates
- Contact form
- FAQ section

### Members Area
- Secure authentication
- Document library with categories
- Meeting minutes archive
- Member directory
- Profile management

### Admin Features
- Content management system
- Member management
- Document upload and organization
- Site settings configuration
- Analytics and monitoring

## Contributing

This is a private project for Radlett Lodge No. 6652. If you're a Lodge member and would like to contribute, please contact the Lodge Secretary.

## License

This project is proprietary and confidential. All rights reserved by Radlett Lodge No. 6652.

## Support

For technical support or questions about the website, please contact:
- Email: mattjohnson56@hotmail.co.uk
- Phone: 07590 800657

---

**Radlett Lodge No. 6652**  
Under the Constitution of the United Grand Lodge of England  
Province of Hertfordshire