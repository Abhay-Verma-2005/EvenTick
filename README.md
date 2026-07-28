# EvenTick

<div align="center">
  <img src="https://eventick-in.vercel.app/_next/static/media/hero.gif" width="100%" />
</div>

<br>

<table>
<tr>

<td width="55%" valign="top">

## Overview

**EvenTick** is a modern full-stack **MERN Microservices** event management platform where users can discover events, book tickets, and manage their hosted events in one seamless experience.

The platform supports multiple user roles including **Ticket Buyers** and **Event Organisers** with dedicated dashboards, personalized features, and AI-powered assistance.

Built with a premium glass-morphism UI, smooth animations and responsive layouts. EvenTick provides a clean and modern user experience across all devices.

<br>

### Live Website

### Experience seamless event booking, AI assistance, and modern ticketing in one platform : **https://eventick-in.vercel.app**

</td>

<td width="45%" align="center">

<img src="https://user-images.githubusercontent.com/74038190/219923809-b86dc415-a0c2-4a38-bc88-ad6cf06395a8.gif" width="100%" />

</td>

</tr>
</table>

---

# 🚀 Special Engineering & Architecture

EvenTick is not a standard monolithic application. It is built using advanced engineering patterns to ensure scalability, security, and performance.

### 1. Microservices Architecture
The backend is completely decoupled into independently deployable microservices:
- **Auth Service (`:6002`)**: The central authority for user identity, authentication, and database access.
- **AI Service (`:6004`)**: Handles all LLM interactions, prompts, and chatbot logic independently.
- **Event Service (`:6008`)**: Manages the core business logic, bookings, and event data.

### 2. Dual-Layered Authentication Security
- **JWT Bearer Strategy**: Completely eliminates cross-site cookie blocking (CORS/Safari issues) by utilizing an Axios interceptor to manage tokens locally.
- **Internal Service Guard (`INT_ACCESS_KEY`)**: Server-to-server communication is strictly protected. Microservices can only talk to the Auth Service if they possess the internal secret key.
- **Centralized Validation**: The AI and Event services do not touch the database for user validation; they act as secure proxies that delegate token verification to the Auth Service.

### 3. High-Performance Redis Caching
- Integrated with **Upstash Redis** to cache user sessions and authentication states.
- Drastically reduces MongoDB database calls during high-traffic ticket booking scenarios.
- Instant, system-wide session invalidation on user logout.

### 4. Native AI Integrations
- **Eventick AI Assistant ✦**: A fully integrated chat overlay to help users discover events and answer queries.
- **AI Tagline Generator**: Automatically generates catchy taglines for users browsing events.
- **AI Description Enhancer**: Helps Event Organisers write compelling descriptions based on their title and venue.

---

# 🎯 Features

| Feature | Description |
|----------|-------------|
| Role-Based Access | Separate dashboards and workflows for Buyers and Event Organisers |
| Event Management | Create events, manage ticket pricing, and monitor ticket sales |
| AI Chat Assistant | Built-in smart assistant for users |
| AI Content Generation | Automated taglines and descriptions for events |
| Cloud Media Storage | Cloudinary integration for high-speed banner and profile picture delivery |
| Personalized Dashboards | Dedicated real-time dashboards for all user roles |
| Responsive UI | Premium glassmorphism design with animations and dark mode |

---

# 🛠 Tech Stack

<div align="center">

<table>
<tr>

<td align="center">
<img src="https://user-images.githubusercontent.com/74038190/212257467-871d32b7-e401-42e8-a166-fcfd7baa4c6b.gif" width="100"><br><b>React</b>
</td>

<td align="center">
<img src="https://user-images.githubusercontent.com/74038190/212257454-16e3712e-945a-4ca2-b238-408ad0bf87e6.gif" width="100"><br><b>JavaScript</b>
</td>

<td align="center">
<img src="https://user-images.githubusercontent.com/74038190/212257460-738ff738-247f-4445-a718-cdd0ca76e2db.gif" width="100"><br><b>Node.js</b>
</td>

</tr><tr>
<td align="center">
<img src="https://github.com/Anmol-Baranwal/Cool-GIFs-For-GitHub/assets/74038190/398b19b1-9aae-4c1f-8bc0-d172a2c08d68" width="100"><br><b>MongoDB</b>
</td>

<td align="center">
<img src="https://github.com/Anmol-Baranwal/Cool-GIFs-For-GitHub/assets/74038190/29fd6286-4e7b-4d6c-818f-c4765d5e39a9" width="100"><br><b>Redis</b>
</td>

<td align="center">
<img src="https://github.com/Anmol-Baranwal/Cool-GIFs-For-GitHub/assets/74038190/67f477ed-6624-42da-99f0-1a7b1a16eecb" width="100"><br><b>CSS</b>



</tr>
</table>

<br>

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, Vanilla CSS, React Icons |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Caching | Redis (Upstash) |
| Authentication | JWT Bearer, Crypto |
| Media / Storage | Cloudinary |
| Infrastructure | Vercel (Frontend), Render (Microservices) |

</div>
 
---

# 💻 Getting Started (Local Development)

Because EvenTick is a microservices-based application, you must run all three backends and the frontend simultaneously.

```bash
git clone https://github.com/Abhay-Verma-2005/EvenTick.git
cd EvenTick
```

### 1. Start the Auth Service
```bash
cd auth-service
npm install
npm run dev
# Runs on http://localhost:6002
```

### 2. Start the Event Service
```bash
cd event-service
npm install
npm run dev
# Runs on http://localhost:6008
```

### 3. Start the AI Service
```bash
cd ai-service
npm install
npm run dev
# Runs on http://localhost:6004
```

### 4. Start the Frontend
Open a final terminal window:
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

*(Ensure you configure the `.env` files in all 4 directories before running the application locally)*

---

# 🔮 Future Advancements

- Improve platform scalability to handle high traffic and large-scale event bookings efficiently  
- CDN integration for faster asset delivery, better loading speed, and improved global performance  
- Advanced QR verification system with secure, real-time ticket validation and fraud detection  
- Mobile app support with real-time notifications, analytics dashboard, and payment gateway integration

---

# 👨‍💻 About Developer

### Abhay Verma
- B.Tech CSE 3rd Year  
- GLA University, Mathura  

This project is designed and developed by **Abhay Verma** using the MERN Stack with focus on modern UI, microservices scalability, and real-world event management workflows.

---

# 📄 License

© 2026 EvenTick. All Rights Reserved.

Licensed under the **MIT License**.
