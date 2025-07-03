# BugTrackR: Software Bug Tracking and Reporting Tool

BugTrackR is an intelligent, role-based bug tracking and reporting system developed as part of my MSc Individual Project (Dissertation) at the University of Leicester. It streamlines bug management workflows by combining structured dashboards, real-time collaboration, and intelligent automation using ML and NLP.

Full report of the project is available in this repository under docs/ for more information.
---

## Project Overview

BugTrackR addresses inefficiencies in traditional bug management systems such as redundant bug reports, delayed assignments, and lack of collaboration. It provides:

- Role-based access for secure and structured workflows
- Real-time collaboration and notifications
- Manual and automated bug triaging
- Semantic duplicate detection and searching using NLP
- Developer/tester analytics for informed decision-making

This project was completed as part of CO7201 – MSc Individual Project.

---

## Features

### Core (Essential)
- User authentication (JWT, OTP, password reset)
- Role-based dashboards (User, Developer, Tester, Team Lead, Admin)
- Bug reporting (general and technical forms)
- Status tracking and updates with drag-and-drop
- Priority assignment and manual bug allocation
- Comment system with @mentions + email alerts
- Duplicate bug detection (manual + NLP-assisted)
- Advanced search and multi-filtering
- Email notifications for major actions

### Recommended
- Automated bug assignment based on workload and expertise
- Priority classification using pre trained model and ML
- Developer, tester, teamlead, admin performance analytics
- Bug reallocation and reopen request workflows
- In-app alerts and scheduled notifications for inactive bugs
- Export bugs to CSV/PDF

### Optional
- Chat system between reporters and tech users
- Favourite bugs
- Unassigned bug queue (team lead/admin)

---

## Tech Stack

| Layer              | Technologies Used                                                                 |
|-------------------|-------------------------------------------------------------------------------------|
| **Frontend**       | React, Tailwind CSS, Material UI, React DnD, Day.js                                |
| **Backend**        | Node.js, Express.js                                                                |
| **Database**       | MongoDB, Mongoose                                                                  |
| **Authentication** | JWT, OTP via Email                                                                 |
| **Real-time**      | Socket.io                                                                          |
| **Testing**        | Jest, React Testing Library                                                        |
| **ML/NLP**         | FastAPI, SentenceTransformers (all-MiniLM-L6-v2), FAISS, Cosine Similarity         |
| **Task Scheduler** | Node Cron                                                                          |
| **Version Control**| GitLab                                                                             |
| **Other Tools**    | Postman, Sourcetree, Instagantt (project planning), Hugging Face (ML models)       |

---

## System Architecture

- **Frontend**: React-based role-specific dashboards for bug management and analytics
- **Backend (Node.js + Express)**:
  - RESTful APIs with RBAC
  - Bug lifecycle management, assignment, comments
  - Integration with ML microservice
- **ML Microservice (FastAPI)**:
  - Duplicate bug detection using sentence embeddings + FAISS
  - Bug priority classification using labeled datasets

---

## Folder Structure
BugTrackR/
├── backend/ # Node.js backend (Express + MongoDB)
├── frontend/ # React frontend (MUI, Tailwind)
├── ml-services/ # FastAPI-based ML microservices
│ ├── duplicate-detection/
│ └── priority-classifier/
├── docs/ # Reports, diagrams, viva slides
├── .env.example # environment config
├── README.md
└── .gitignore

## ⚙️ Setup and Installation

### Prerequisites
- Node.js v18+
- MongoDB
- Python 3.9+
- Git

---

### 1. Clone the repository

```bash
git clone https://github.com/your-username/BugTrackR-MSc-Project.git
cd BugTrackR-MSc-Project
```

### 2. Set up backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```
Ensure MongoDB is running locally or update .env for Atlas URI.

### 3.Set up frontend
```bash
cd ../frontend
cp .env.example .env
npm install
npm start
```
### 4. Set up ML services (for both duplicate detection and priority classification)
```bash
cd ../duplicate-detection-service
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

## Testing

### Frontend
Run unit tests using:

```bash
npm test
```

### Backend
Use **Postman** to manually test all API endpoints.

### ML Models
Use dummy data or sample bug reports to test the following endpoints:

- `POST /check-duplicate`  
- `POST /classify-priority`

These endpoints are hosted in the FastAPI-based ML microservices.

## Author
Harishmitha Raja
harishmithar16@gmail.com
