const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const fileDBPath = './userFiles.json';
let otpStore = {};

app.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = otp;

  try {
    const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  transporter.verify(function (error, success) {
  if (error) {
    console.log("SMTP error:", error);
  } else {
    console.log("SMTP server ready");
  }
});

    await transporter.sendMail({
      from: `"Gallery OTP" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP is ${otp}. It is valid for 5 minutes.`
    });

    res.json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (otpStore[email] && otpStore[email] === otp) {
    delete otpStore[email];
    return res.json({ success: true, message: 'OTP verified' });
  }

  return res.status(400).json({ success: false, message: 'Invalid OTP' });
});



const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, 'uploads', 'temp');
    fs.mkdirSync(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage: tempStorage });

app.post('/upload', upload.single('file'), (req, res) => {
  const email = req.body.email;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const userDir = path.join(__dirname, 'uploads', email);
  fs.mkdirSync(userDir, { recursive: true });

  const targetPath = path.join(userDir, file.filename);
  fs.renameSync(file.path, targetPath); 

  const fileData = {
    email,
    originalname: file.originalname,
    filename: file.filename,
    uploadedAt: Date.now(),
    type: file.mimetype.startsWith('image') ? 'image' : 'video',
  };


  let db = {};
  if (fs.existsSync(fileDBPath)) {
    db = JSON.parse(fs.readFileSync(fileDBPath));
  }

  if (!db[email]) {
    db[email] = [];
  }

  db[email].push(fileData);
  fs.writeFileSync(fileDBPath, JSON.stringify(db, null, 2));

  res.json({ message: "File uploaded successfully", file: fileData });
});



app.get('/gallery', (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: "Email required" });

  let db = {};
  if (fs.existsSync(fileDBPath)) {
    db = JSON.parse(fs.readFileSync(fileDBPath));
  }
  const files = (db[email] || []).sort(
    (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)
  );

  res.json({ files });
});


app.get('/download', (req, res) => {
  const { email, filename } = req.query;
  if (!email || !filename) return res.status(400).send("Missing data");

  const filePath = path.join(__dirname, 'uploads', email, filename);
  if (!fs.existsSync(filePath)) return res.status(404).send("File not found");

  res.download(filePath);
});


app.delete('/delete', (req, res) => {
  const { email, filename } = req.query;
  if (!email || !filename) return res.status(400).send("Missing data");

  const db = JSON.parse(fs.readFileSync(fileDBPath));
  if (!db[email]) return res.status(404).send("User not found");

  const filePath = path.join(__dirname, 'uploads', email, filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  db[email] = db[email].filter(f => f.filename !== filename);
  fs.writeFileSync(fileDBPath, JSON.stringify(db, null, 2));

  res.json({ message: "Deleted successfully" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
