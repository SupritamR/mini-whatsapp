const mongoose = require("mongoose");

const chats = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    from:{
        type: String,
        required : true
    },
    to:{
        type: String,
        required : true
    },
    msg:{
        type: String,
        maxLength: 50
    },
    created_at:{
         type:Date,
         required: true
    },
});

chats.index({ owner: 1, created_at: -1 });

const Chat = mongoose.model("Chat",chats);

module.exports = Chat;