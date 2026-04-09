N 🎯 Backend Development in 6 Phases

---

# 🟢 Phase 1: Project Setup & Server Foundation

## 🎯 Goal:

Create a clean, scalable backend structure

## ✅ Steps:

### 1. Initialize project

```bash
mkdir hostel-backend
cd hostel-backend
npm init -y
```

---

### 2. Install dependencies

```bash
npm install express mongoose cors dotenv
npm install nodemon --save-dev
```

---

### 3. Basic server setup

```javascript
// server.js
const express = require("express");
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API running");
});

app.listen(5000, () => console.log("Server running"));
```

---

### 4. Folder structure

```plaintext
backend/
 ├── controllers/
 ├── models/
 ├── routes/
 ├── middleware/
 ├── services/   ← AI/API logic
 └── config/
```

---

### 5. Connect database (MongoDB)

```javascript
// config/db.js
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI);
```

---

# 🟡 Phase 2: Authentication & Role Management

## 🎯 Goal:

Secure login system with roles

## ✅ Steps:

---

### 1. Create User model

```javascript
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String // student, admin, warden
});
```

---

### 2. Install auth packages

```bash
npm install bcryptjs jsonwebtoken
```

---

### 3. Register & Login APIs

* `/api/auth/register`
* `/api/auth/login`

---

### 4. Password hashing

```javascript
const hashed = await bcrypt.hash(password, 10);
```

---

### 5. JWT token generation

```javascript
const token = jwt.sign({ id: user._id, role: user.role }, "secret");
```

---

### 6. Auth middleware

* Protect routes
* Check role (admin/warden/student)

---

# 🔵 Phase 3: Core Modules (CRUD APIs)

## 🎯 Goal:

Build all main system APIs

## ✅ Steps:

---

### 👨‍🎓 Student APIs

* Get profile
* Get room details

---

### 🛏️ Room APIs

* Create room
* Assign student
* Get all rooms

---

### 💰 Fee APIs

* Add fee record
* Get payment history
* Update status

---

### 📝 Complaint APIs

* Create complaint
* Get complaints
* Update status

---

### 🏖️ Leave APIs

* Apply leave
* Approve/reject

---

👉 Use MVC pattern:

* Routes → Controllers → Models

---

# 🟠 Phase 4: AI Integration Layer

## 🎯 Goal:

Connect backend with Python AI service

## ✅ Steps:

---

### 1. Create AI service handler

```javascript
// services/aiService.js
const axios = require("axios");

const analyzeComplaint = async (text) => {
  const res = await axios.post("http://localhost:8000/analyze", { text });
  return res.data;
};
```

---

### 2. Use AI in complaint API

```javascript
const result = await analyzeComplaint(description);

complaint.category = result.category;
complaint.priority = result.priority;
```

---

### 3. Add endpoints:

* `/api/ai/analyze-complaint`
* `/api/ai/predict-fee`
* `/api/ai/room-allocation`

---

### 4. Error handling

* If AI fails → fallback:

  * category = “General”

---

# 🟣 Phase 5: Advanced Features & Optimization

## 🎯 Goal:

Make backend production-ready

## ✅ Steps:

---

### 1. Validation

* Use:

```bash
npm install express-validator
```

---

### 2. Pagination & filtering

* Complaints list
* Student list

---

### 3. Logging

* Console logs or logger middleware

---

### 4. Central error handler

```javascript
app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});
```

---

### 5. Role-based access control

* Only admin:

  * create rooms
* Only warden:

  * approve leave

---

# 🔴 Phase 6: Deployment & Final Touch

## 🎯 Goal:

Make backend live and usable

## ✅ Steps:

---

### 1. Environment variables

```env
MONGO_URI=your_db
JWT_SECRET=your_secret
```

---

### 2. Security improvements

```bash
npm install helmet morgan
```

---

### 3. Enable CORS

```javascript
app.use(cors());
```

---

### 4. Deploy backend

* Render / Railway / AWS

---

### 5. Connect frontend

* Replace localhost APIs with live URLs
