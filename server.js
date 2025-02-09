const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

//nodemailer--transporter
const transporter = nodemailer.createTransport({
  secure: false,
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: "arijitkumar2912@gmail.com",
    pass: "uqrz hrnc bxbm ouds",
  },
});

function sendMail(to, sub, msg) {
  transporter.sendMail(
    {
      from: "donotreply@gmail.com", // Sender's email
      to: to,
      subject: sub,
      html: msg,
    },
    (err, info) => {
      if (err) {
        console.error("Error sending email:", err);
      } else {
        console.log("Email sent:", info.response);
      }
    }
  );
}
// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// Define Contact schema and model
const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
  },
  phone: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^\d{10}$/.test(v); // Ensures exactly 10 digits
      },
      message: "Phone number must be exactly 10 digits",
    },
  },
  message: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 1000,
  },
  service: {
    type: String,
    required: true,
    enum: ["Video Editing", "Website Development", "Learn Courses"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Contact = mongoose.model("Contact", contactSchema);

// API routes
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, message, phone, service } = req.body;
    const newContact = new Contact({ name, email, message, phone, service });
    await newContact.save();
    sendMail(
      "arijitkumar2912@gmail.com",
      "New user detail received",
      `<h3>New Contact Form Submission</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Service:</strong> ${service}</p>
      <p><strong>Message:</strong> ${message}</p>`
    );
    sendMail(
      `${email}`,
      "Thank you for contact us",
      `<p>Hi ${name},</p>
      <p>Thank you for your inquiry! We have received your details and will get back to you shortly. Our team is excited to assist you with your requirements on ${service}</p>
      <p>If you have any urgent queries, you can reach us at arijitkumar2912@gmail.com</p>
      <p>Looking forward to working with you!</p>
      <address>
        Best Regards
      </address>
      `
    );
    res.status(200).json({ message: "Contact message saved successfully" });
  } catch (error) {
    console.error("Error saving contact message:", error);
    res.status(500).json({ message: "Failed to save contact message" });
  }
});

// Serve the HTML file for all routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
