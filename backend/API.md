# Livora Backend — API Reference

## Base URL
```
http://localhost:5000
```

## Authentication
All protected routes require: `Authorization: Bearer <token>`

---

## 🔐 Auth  `/api/auth`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/register` | No | Register new user |
| POST | `/login` | No | Login → returns JWT token |
| GET | `/me` | Yes | Get current user profile |
| PUT | `/update-profile` | Yes | Update name/phone/course |
| PUT | `/change-password` | Yes | Change password |

### Login Request
```json
{ "email": "admin@livora.edu", "password": "hostel@123" }
```
### Login Response
```json
{ "success": true, "token": "eyJ...", "user": { "id": "...", "role": "admin" } }
```

---

## 👤 Users  `/api/users`

| Method | Route | Role | Description |
|--------|-------|------|-------------|
| GET | `/` | admin, warden | List all users (paginated, searchable) |
| GET | `/stats` | admin, warden | User & room stats |
| GET | `/:id` | any | Get user by ID |
| PUT | `/:id` | admin | Update user |
| DELETE | `/:id` | admin | Soft-delete user |

### Query Params
`?role=student&search=rahul&page=1&limit=10`

---

## 🛏️ Rooms  `/api/rooms`

| Method | Route | Role | Description |
|--------|-------|------|-------------|
| GET | `/` | any | List all rooms (filtered) |
| GET | `/:id` | any | Get room details |
| POST | `/` | admin | Create room |
| PUT | `/:id` | admin | Update room |
| DELETE | `/:id` | admin | Delete room (not if occupied) |
| POST | `/:id/assign` | admin | Assign student to room |
| DELETE | `/:id/remove/:studentId` | admin | Remove student from room |
| POST | `/auto-allocate` | admin | 🤖 AI auto-allocate unassigned students |

### Query Params
`?status=Available&block=A&type=Single`

---

## 💰 Fees  `/api/fees`

| Method | Route | Role | Description |
|--------|-------|------|-------------|
| GET | `/` | any | List fees (students see own only) |
| GET | `/stats` | admin, warden | Fee collection stats |
| GET | `/:id` | any | Get fee by ID |
| POST | `/` | admin | Create fee record |
| PUT | `/:id/status` | admin | Toggle Paid/Unpaid |
| DELETE | `/:id` | admin | Delete fee record |
| POST | `/predict-default` | admin | 🤖 AI predict fee default risk |

---

## 📝 Complaints  `/api/complaints`

| Method | Route | Role | Description |
|--------|-------|------|-------------|
| GET | `/` | any | List complaints (students see own) |
| GET | `/stats` | admin, warden | Complaint breakdown stats |
| GET | `/:id` | any | Get complaint by ID |
| POST | `/` | any | Submit complaint (🤖 AI auto-classifies) |
| PUT | `/:id/status` | admin, warden | Update status |
| DELETE | `/:id` | any | Delete complaint |

### Create Request (AI classifies automatically)
```json
{ "title": "WiFi not working", "description": "Internet down since morning" }
```
### Response includes
```json
{ "aiClassification": { "category": "Network", "priority": "High", "source": "fallback" } }
```

---

## ✈️ Leave  `/api/leave`

| Method | Route | Role | Description |
|--------|-------|------|-------------|
| GET | `/` | any | List leaves |
| GET | `/stats` | admin, warden | Leave stats |
| GET | `/:id` | any | Get leave by ID |
| POST | `/` | student | Apply for leave |
| PUT | `/:id/action` | admin, warden | Approve / Reject |
| DELETE | `/:id` | any | Cancel pending leave |

### Process Leave
```json
{ "action": "approve" }
// or
{ "action": "reject", "rejectionReason": "Semester exams in progress" }
```

---

## 🤖 AI  `/api/ai`

| Method | Route | Role | Description |
|--------|-------|------|-------------|
| POST | `/analyze-complaint` | any | Classify complaint text |
| POST | `/sentiment` | any | Analyze sentiment |
| POST | `/predict-fee` | admin | Predict fee default risk |
| POST | `/room-allocation` | admin | Suggest room assignments |
| GET | `/dashboard` | admin, warden | AI insights summary |

---

## 🩺 Health  

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/` | No | API info + all endpoints |
| GET | `/api/health` | No | DB status, uptime, memory |

---

## 📦 Default Seed Credentials
After running `npm run seed`:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@livora.edu | hostel@123 |
| Warden | warden@livora.edu | hostel@123 |
| Student | rahul@livora.edu | hostel@123 |
