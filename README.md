# Buddy Project

AI-powered browser extension with Node.js backend.

## Project Structure

```
Buddy/
├── backend/          # Node.js backend server
│   ├── src/
│   │   ├── config/   # Database and API configurations
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── utils/
│   └── package.json
│
└── frontend/         # Browser extension
    └── buddy-extension/
        ├── src/      # Extension source code
        └── dist/     # Built extension files
```

## Setup Instructions

### Backend Setup
```bash
cd backend
npm install
npm start
```

### Frontend Setup
```bash
cd frontend/buddy-extension
npm install
npm run build
```

## Technologies Used

- **Backend**: Node.js, Express
- **Frontend**: React, TypeScript, Vite
- **Database**: MongoDB (configured)
- **AI**: Google Gemini API

