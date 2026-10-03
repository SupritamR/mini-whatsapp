const mongoose = require("mongoose");
const Chat = require("./models/chat.js");

main()
 .then(() => console.log("succesful"))
 .catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/wpt');
}

let chats=[
  {
    from: "Alice",
    to: "Bob",
    msg: "Hey Bob, how are you?",
    created_at: new Date("2026-06-16T10:15:00Z")
  },
  {
    from: "Bob",
    to: "Alice",
    msg: "I'm good! What about you?",
    created_at: new Date("2026-06-16T10:16:30Z")
  },
  {
    from: "Charlie",
    to: "David",
    msg: "Meeting at 3 PM.",
    created_at: new Date("2026-06-16T09:45:00Z")
  },
  {
    from: "Emma",
    to: "Sophia",
    msg: "Happy Birthday!",
    created_at: new Date("2026-06-15T18:20:00Z")
  },
  {
    from: "John",
    to: "Mike",
    msg: "Call me when free.",
    created_at: new Date("2026-06-16T07:30:00Z")
  }
];

Chat.insertMany(chats);