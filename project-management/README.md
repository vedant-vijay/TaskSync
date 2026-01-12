# 🚀 Real-Time Collaborative Task Management System

A modern, real-time task management application built with React and Node.js, featuring WebSocket-based collaboration, role-based access control, and live presence tracking.

## ✨ Features

### 🎯 Core Functionality
- **Real-time Task Board** - Kanban-style board with 4 columns (To Do, In Progress, Review, Done)
- **Live Collaboration** - See who's viewing and editing tasks in real-time
- **Role-Based Access Control** - LEADER and MEMBER roles with different permissions
- **Task Management** - Create, assign, update, and track tasks
- **Comments System** - Real-time task comments with timestamps
- **Project Management** - Create projects and manage team members
- **User Presence** - Live tracking of online users in each project

### 🔐 Security & Authentication
- JWT-based authentication
- Secure password hashing
- Role-based authorization
- Protected WebSocket connections

### 🎨 UI/UX
- Modern, responsive design with Tailwind CSS
- Real-time toast notifications
- Loading states and error handling
- Intuitive drag-free task management

## 🏗️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **date-fns** - Date formatting
- **Axios** - HTTP client
- **React Router** - Navigation

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **WebSocket (ws)** - Real-time communication
- **MongoDB** - Database (native driver)
- **JWT** - Authentication
- **bcrypt** - Password hashing

## 📁 Project Structure
```
project-root/
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── LoadingSpinner.jsx
│   │   │   │   └── Toast.jsx
│   │   │   ├── projects/
│   │   │   │   ├── ProjectCard.jsx
│   │   │   │   ├── ProjectList.jsx
│   │   │   │   ├── CreateProjectModal.jsx
│   │   │   │   └── AddMemberModal.jsx
│   │   │   └── tasks/
│   │   │       ├── TaskBoard.jsx
│   │   │       ├── TaskColumn.jsx
│   │   │       ├── TaskCard.jsx
│   │   │       ├── CreateTaskModal.jsx
│   │   │       └── TaskDetailModal.jsx
│   │   ├── contexts/
│   │   │   └── WebSocketContext.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useProjects.js
│   │   │   ├── useWebSocket.js
│   │   │   └── useToast.js
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   └── ProjectPage.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── projectService.js
│   │   │   └── userService.js
│   │   ├── utils/
│   │   │   └── constants.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env
│   ├── package.json
│   └── vite.config.js
│
└── backend/                 # Node.js backend
    ├── config/
    │   └── database.js
    ├── middleware/
    │   └── auth.js
    ├── models/
    │   ├── User.js
    │   ├── Project.js
    │   └── Task.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── projectRoutes.js
    │   ├── taskRoutes.js
    │   └── userRoutes.js
    ├── websocket/
    │   ├── wsServer.js
    │   ├── wsHandlers.js
    │   ├── eventHandlers.js
    │   └── connectionManager.js
    ├── utils/
    │   └── jwtUtils.js
    ├── .env
    ├── package.json
    └── server.js
```

## ⚙️ Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- MongoDB 4.4+
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/task-management-system.git
cd task-management-system
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` file in `backend/` directory:
```env
# Server Configuration
HTTP_PORT=3000
WS_PORT=8080
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/task_manager

# JWT Secret (use a strong random string in production)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Create `.env` file in `frontend/` directory:
```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:8080
```

### 4. Start MongoDB

Make sure MongoDB is running:
```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

## 🚀 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **WebSocket**: ws://localhost:8080

### Production Build

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## 📡 WebSocket Events

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `AUTHENTICATE` | `{ token }` | Authenticate WebSocket connection |
| `JOIN_PROJECT` | `{ projectId }` | Join a project room |
| `LEAVE_PROJECT` | `{ projectId }` | Leave a project room |
| `CREATE_TASK` | `{ projectId, title, description, assignedTo?, status }` | Create a new task |
| `UPDATE_TASK_STATUS` | `{ taskId, status, projectId }` | Update task status |
| `ASSIGN_TASK` | `{ taskId, assignedTo, projectId }` | Assign task to user |
| `ADD_COMMENT` | `{ taskId, text, projectId }` | Add comment to task |
| `START_VIEWING_TASK` | `{ taskId, projectId }` | Start viewing a task |
| `STOP_VIEWING_TASK` | `{ taskId, projectId }` | Stop viewing a task |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `AUTHENTICATED` | `{ userId, name, role }` | Authentication successful |
| `PROJECT_JOINED` | `{ project, tasks, members, onlineUsers }` | Successfully joined project |
| `TASK_CREATED` | `{ task, createdBy }` | New task created |
| `TASK_STATUS_UPDATED` | `{ taskId, status, updatedBy }` | Task status changed |
| `TASK_ASSIGNED` | `{ taskId, assignedTo, assignedBy }` | Task assigned to user |
| `TASK_COMMENT_ADDED` | `{ taskId, comment, author }` | New comment added |
| `TASK_VIEWER_JOINED` | `{ taskId, user }` | User started viewing task |
| `TASK_VIEWER_LEFT` | `{ taskId, userId }` | User stopped viewing task |
| `USER_CONNECTED` | `{ user, projectId }` | User joined project |
| `USER_DISCONNECTED` | `{ userId, projectId }` | User left project |
| `ERROR` | `{ message }` | Error occurred |

## 🎯 Usage Guide

### As a LEADER

1. **Create a Project**
   - Login and go to Dashboard
   - Click "Create Project"
   - Enter project name and description

2. **Add Members**
   - Open your project
   - Click "Add Member"
   - Search by email address
   - Select role (MEMBER or LEADER)
   - Click "Add to Project"

3. **Create Tasks**
   - Click "Create Task"
   - Fill in title, description
   - Assign to a team member
   - Set initial status

4. **Manage Tasks**
   - Click on any task to open details
   - Update status via dropdown
   - Reassign to different members
   - Add comments for collaboration

### As a MEMBER

1. **View Projects**
   - After leader adds you, projects appear on dashboard
   - Click project to see task board

2. **Work on Tasks**
   - View all tasks in the project
   - Update task status (To Do → In Progress → Review → Done)
   - Add comments to tasks
   - See who else is viewing/editing

3. **Real-time Collaboration**
   - See online team members in sidebar
   - View who's looking at each task (eye icon)
   - Track active editors (edit icon)

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Projects
- `GET /api/projects` - Get user's projects
- `POST /api/projects` - Create new project (Leader only)
- `GET /api/projects/:id` - Get project details
- `POST /api/projects/:id/members` - Add member to project (Leader only)

### Users
- `GET /api/users/search?email=...` - Search user by email
- `GET /api/users/me` - Get current user info

### Tasks
- `GET /api/tasks/project/:projectId` - Get tasks for project
- `POST /api/tasks` - Create new task

## 🐛 Known Issues & Solutions

### Issue: Empty String ObjectId Error
**Error**: `BSONError: input must be a 24 character hex string`
**Solution**: Always validate and convert empty strings to `null` before passing to MongoDB ObjectId constructor.

### Issue: Task Assignment Not Working
**Solution**: Ensure backend sends `_id` field (not `id`) and frontend supports both formats.

### Issue: Members Not Showing in Dropdown
**Solution**: Check that `getMembersWithDetails` method in Project model returns properly formatted member objects.

## 🔒 Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use strong JWT secrets in production
   - Change default MongoDB credentials

2. **Authentication**
   - Passwords are hashed with bcrypt
   - JWT tokens expire after set duration
   - WebSocket connections require authentication

3. **Authorization**
   - Role-based access control enforced on backend
   - Frontend UI reflects permissions
   - Backend validates all operations

## 🛠️ Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Code Style
- ESLint configuration included
- Prettier for code formatting
- Follow React best practices

## 📝 Environment Variables Reference

### Backend (.env)
```env
HTTP_PORT=3000                    # HTTP server port
WS_PORT=8080                      # WebSocket server port
NODE_ENV=development              # development | production
MONGODB_URI=mongodb://...         # MongoDB connection string
JWT_SECRET=your_secret_key        # JWT signing secret
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api    # Backend API URL
VITE_WS_URL=ws://localhost:8080           # WebSocket URL
```

## 🚢 Deployment

### Backend Deployment (e.g., Heroku, Railway)

1. Set environment variables in your hosting platform
2. Ensure MongoDB is accessible (use MongoDB Atlas for cloud)
3. Update `MONGODB_URI` to production database
4. Set `NODE_ENV=production`

### Frontend Deployment (e.g., Vercel, Netlify)

1. Build the frontend: `npm run build`
2. Set environment variables in hosting platform
3. Update API URLs to production backend
4. Deploy the `dist` folder

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - *Initial work* - [YourGitHub](https://github.com/YOUR_USERNAME)

## 🙏 Acknowledgments

- React team for the amazing framework
- MongoDB for the database
- All contributors who help improve this project

## 📞 Support

For support, email your@email.com or open an issue on GitHub.

---

**Built with ❤️ using React, Node.js, and MongoDB**