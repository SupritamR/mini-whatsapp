const express = require("express");
require("dotenv").config();
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const Chat = require("./models/chat.js");
const User = require("./models/user.js");
const methodOverride = require("method-override");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const nodemailer = require("nodemailer");
const { randomInt } = require("crypto");

app.set("views",path.join(__dirname,"views"));
app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(session({
    secret: process.env.SESSION_SECRET || "development-only-change-this-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));

main()
 .then(() => console.log("succesful"))
 .catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/wpt');
}

function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.redirect("/");
    }

    next();
}

function renderLanding(res, authError) {
    res.render("landing.ejs", { authError });
}

function normalizeEmail(email) {
    const normalized = email?.trim().toLowerCase();
    return normalized || undefined;
}

function normalizePhone(phone) {
    const normalized = phone?.replace(/[\s()-]/g, "");
    return normalized || undefined;
}

function createOtp() {
    return randomInt(100000, 1000000).toString();
}

async function sendEmailOtp(email, otp) {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        throw new Error("Email OTP is not configured yet.");
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
        }
    });

    await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: email,
        subject: "Your Pingroom login code",
        text: `Your Pingroom login code is ${otp}. It expires in 10 minutes.`
    });
}

async function sendSmsOtp(phone, otp) {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
        throw new Error("Mobile OTP is not configured yet.");
    }

    const body = new URLSearchParams({
        To: phone,
        From: TWILIO_FROM_NUMBER,
        Body: `Your Pingroom login code is ${otp}. It expires in 10 minutes.`
    });
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body
    });

    if (!response.ok) {
        throw new Error("The SMS provider could not send the code.");
    }
}

async function sendOtp(user, channel) {
    const otp = createOtp();
    if (channel === "email") {
        await sendEmailOtp(user.email, otp);
    } else {
        await sendSmsOtp(user.phone, otp);
    }

    user.otpHash = await bcrypt.hash(otp, 10);
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.otpSentAt = new Date();
    user.otpAttempts = 0;
    await user.save();
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

app.post("/register", async (req, res) => {
    const username = req.body.username?.trim();
    const password = req.body.password || "";
    const email = normalizeEmail(req.body.email);
    const phone = normalizePhone(req.body.phone);

    if (!username || password.length < 6 || (!email && !phone)) {
        return renderLanding(res, "Add a username, a 6-character password, and an email or mobile number.");
    }

    const existingUser = await User.findOne({
        $or: [{ username }, ...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])]
    });
    if (existingUser) {
        return renderLanding(res, "That username or contact is already registered.");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ username, email, phone, passwordHash });
    req.session.userId = user._id.toString();
    req.session.username = user.username;
    res.redirect("/data");
});

app.post("/login", async (req, res) => {
    const username = req.body.username?.trim();
    const password = req.body.password || "";
    const user = await User.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return renderLanding(res, "Username or password is incorrect.");
    }

    req.session.userId = user._id.toString();
    req.session.username = user.username;
    res.redirect("/data");
});

app.post("/otp/request", async (req, res) => {
    const channel = req.body.channel === "phone" ? "phone" : "email";
    const identifier = channel === "email" ? normalizeEmail(req.body.identifier) : normalizePhone(req.body.identifier);
    const query = channel === "email" ? { email: identifier } : { phone: identifier };
    const user = await User.findOne(query);

    if (!user) {
        return renderLanding(res, "No Pingroom account was found for that contact.");
    }

    if (user.otpSentAt && Date.now() - user.otpSentAt.getTime() < 60 * 1000) {
        return renderLanding(res, "Please wait a minute before requesting another code.");
    }

    try {
        await sendOtp(user, channel);
        req.session.pendingOtpUserId = user._id.toString();
        req.session.pendingOtpChannel = channel;
        res.render("otp.ejs", { channel, identifier, authError: null });
    } catch (error) {
        renderLanding(res, error.message);
    }
});

app.post("/otp/verify", async (req, res) => {
    const userId = req.session.pendingOtpUserId;
    const code = req.body.code?.trim();
    const user = userId ? await User.findById(userId) : null;
    const channel = req.session.pendingOtpChannel || "email";

    if (!user || !user.otpHash || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
        return res.render("otp.ejs", { channel, identifier: "", authError: "That code has expired. Request a new one." });
    }

    if (user.otpAttempts >= 5) {
        return res.render("otp.ejs", { channel, identifier: "", authError: "Too many attempts. Request a new code." });
    }

    user.otpAttempts += 1;
    const valid = await bcrypt.compare(code || "", user.otpHash);
    if (!valid) {
        await user.save();
        return res.render("otp.ejs", { channel, identifier: "", authError: "That code is not correct." });
    }

    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    user.otpSentAt = undefined;
    user.otpAttempts = 0;
    await user.save();
    req.session.userId = user._id.toString();
    req.session.username = user.username;
    delete req.session.pendingOtpUserId;
    delete req.session.pendingOtpChannel;
    res.redirect("/data");
});

app.post("/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/"));
});

app.get("/data", requireAuth, async(req,res) => {
         const search = req.query.q?.trim() || "";
         const filter = { owner: req.session.userId };

         if (search) {
             const searchRegex = new RegExp(escapeRegex(search), "i");
             filter.$or = [
                 { from: searchRegex },
                 { to: searchRegex },
                 { msg: searchRegex }
             ];
         }

         const [c, totalChats] = await Promise.all([
             Chat.find(filter)
             .sort({ created_at: -1 })
             .select("from to msg created_at")
             .lean(),
             Chat.countDocuments({ owner: req.session.userId })
         ]);
         //console.log(c);
         res.render("index.ejs",{ c, username: req.session.username, search, totalChats });
})

app.get("/chats/new", requireAuth, (req,res)=>{
    res.render("new.ejs");
})

app.post("/data", requireAuth, async (req, res) => {
    let { from, msg, to } = req.body;

    let newChat = new Chat({
    owner: req.session.userId,
    from,
    msg,
    to,
    created_at: new Date()

    });

    await newChat.save();

    res.redirect("/data");
});

app.get("/chats/:id/edit", requireAuth, async (req, res) => {
    let { id } = req.params;
    let chat = await Chat.findOne({ _id: id, owner: req.session.userId });

    if (!chat) {
        return res.redirect("/data");
    }

    res.render("edit.ejs", { chat });
});

app.put("/chats/:id", requireAuth, async (req, res) => {
    let { id } = req.params;
    let { msg } = req.body;

    await Chat.findOneAndUpdate({ _id: id, owner: req.session.userId }, { msg });

    res.redirect("/data");
}); 

app.delete("/chats/:id", requireAuth, async (req, res) => {
    let { id } = req.params;

    await Chat.findOneAndDelete({ _id: id, owner: req.session.userId });

    res.redirect("/data");
});

app.get("/",(req,res) =>{
    if (req.session.userId) {
        return res.redirect("/data");
    }

    renderLanding(res);
});

app.listen(8000, () =>{
    console.log("server listening at port 8000");
});