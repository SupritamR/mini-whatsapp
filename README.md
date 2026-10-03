
# 💬 Mini WhatsApp

A simple **WhatsApp-like chat application** built using **Node.js, Express.js, MongoDB, Mongoose, EJS, HTML, and CSS**.

This project demonstrates how a real-time/chat-based web application can be structured using the **MERN-style backend technologies** and RESTful routes.

## 🚀 Features

- 💬 Create and view chats
- 👤 Sender and receiver information
- 📝 Create new messages
- ✏️ Edit existing messages
- 🗑️ Delete messages
- 📅 Display message creation time
- 💾 Store chats in MongoDB
- 🎨 Simple and responsive UI
- 🔗 RESTful Express.js routes
- 📄 EJS template rendering

## 🛠️ Technologies Used

- **Node.js** – JavaScript runtime
- **Express.js** – Backend web framework
- **MongoDB** – Database
- **Mongoose** – MongoDB ODM
- **EJS** – Template engine
- **HTML5** – Page structure
- **CSS3** – Styling
- **JavaScript** – Application logic

## 📁 Project Structure

```text
mini-whatsapp/
│
├── models/
│   └── chat.js
│
├── public/
│   └── style.css
│
├── views/
│   ├── index.ejs
│   ├── new.ejs
│   └── edit.ejs
│
├── index.js
├── package.json
├── package-lock.json
└── README.md
```

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/SupritamR/mini-whatsapp.git
```

### 2. Go to the project directory

```bash
cd mini-whatsapp
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start MongoDB

Make sure MongoDB is installed and running on your system.

### 5. Start the application

```bash
node index.js
```

Or, if you have a start script:

```bash
npm start
```

### 6. Open in browser

```text
http://localhost:8080
```

## 🗄️ Database

The application uses **MongoDB** to store chat information.

Example chat document:

```javascript
{
    from: "Alice",
    to: "Bob",
    msg: "Hello Bob!",
    created_at: Date
}
```

## 🔗 Main Routes

| Method | Route | Description |
|---|---|---|
| GET | `/chats` | Display all chats |
| GET | `/chats/new` | Show new chat form |
| POST | `/chats` | Create a new chat |
| GET | `/chats/:id/edit` | Edit a chat |
| PUT | `/chats/:id` | Update a chat |
| DELETE | `/chats/:id` | Delete a chat |

> The exact routes may vary depending on the current version of the project.

## 🎯 Project Purpose

The main purpose of this project is to understand:

- Express.js routing
- CRUD operations
- MongoDB database integration
- Mongoose schemas and models
- EJS templating
- REST APIs
- Backend project structure

## 🔮 Future Improvements

Some features that can be added in the future:

- 🔐 User authentication and login
- ⚡ Real-time messaging using Socket.IO
- 🟢 Online/offline status
- 📷 Image and file sharing
- 🔔 Message notifications
- 👥 Group chats
- 🔒 Password encryption
- 📱 Better mobile responsiveness

## 👨‍💻 Author

**Supritam Pal**

- GitHub: [SupritamR](https://github.com/SupritamR)

## ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub.
