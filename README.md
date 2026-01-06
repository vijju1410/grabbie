🛒 Grabbie – Multi-Vendor E-Commerce & Delivery System
Grabbie is a full-stack MERN application inspired by platforms like Swiggy & Zomato, designed to connect local vendors, customers, and delivery partners in a single hyperlocal commerce ecosystem.
It supports multi-vendor product listings, real-time cart & orders, secure payments, and role-based dashboards.

🚀 Live Demo
🔗 Frontend: https://grabbie-1.onrender.com
🔗 Backend API: https://grabbie-cluster.onrender.com
⚠️ Note: Hosted on Render (free tier), so initial load may take a few seconds.

🧩 Key Features
👤 Customer
Browse products by category
Product detail page with quantity control
Add to cart & buy now
Real-time cart sync
Order history tracking
Secure authentication (JWT + Google OAuth)

🏪 Vendor
Vendor registration & admin approval
Vendor dashboard
Add, update & manage products
Order management
Real-time order notifications (Socket.io)

🚚 Delivery Partner
Driver registration & approval
Assigned order tracking
Order pickup & delivery status updates

🛠️ Admin
Admin dashboard
Approve / reject vendors & drivers
View all users, orders & analytics


💳 Payments
Razorpay integration (Test & Live mode)
Secure order creation & verification
Ready for production payments


🧠 Tech Stack
Frontend
React.js
React Router
Tailwind CSS
Axios
Context API
React Hot Toast
Backend
Node.js
Express.js
MongoDB (Mongoose)
JWT Authentication
Google OAuth
Socket.io
Deployment
Render (Frontend & Backend)
MongoDB Atlas


🔐 Authentication & Security
JWT-based authentication
Role-based access control (Customer / Vendor / Driver / Admin)
Protected routes (frontend & backend)
Secure API endpoints
Token expiration handling


📂 Project Structure

grabbie/
│
├── backend/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── server.js
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   ├── App.js
│   │   └── index.js
│
└── README.md

⚙️ Environment Variables
Backend (.env)
PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
FRONTEND_URL=https://grabbie-1.onrender.com

Frontend (.env)
REACT_APP_API_URL=https://grabbie-cluster.onrender.com
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id

🧪 Run Locally
1️⃣ Clone the repository
Bash
git clone https://github.com/your-username/grabbie.git
cd grabbie

2️⃣ Backend setup
Bash
cd backend
npm install
npm run dev

3️⃣ Frontend setup
Bash
cd frontend
npm install
npm start

📸 Screenshots
Home Page
Product Detail Page
Cart & Checkout
Vendor Dashboard
Admin Panel
📌 Screenshots will be added soon.

🏆 Project Highlights
Real-world architecture
Production-ready API structure
Clean UI with Tailwind CSS
Proper cart quantity synchronization
SPA routing with refresh fix
Scalable for real deployment

🎯 Future Enhancements
Mobile app (React Native)
Push notifications
Location-based delivery tracking
Vendor analytics dashboard
Wallet & refund system

👨‍💻 Author
Vijay Prajapati
🎓 MCA Final Year Student
💻 Full-Stack MERN Developer
📧 Email: vijayprajapati1410@gmail.com
🌐 GitHub: https://github.com/viju1410

⭐ Support
If you like this project:
⭐ Star the repository
🍴 Fork it
🧑‍💻 Use it as a reference for MERN projects
