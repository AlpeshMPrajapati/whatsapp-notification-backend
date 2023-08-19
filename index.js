require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// App config
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// DB connection
mongoose.connect('mongodb://localhost:27017', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const reminderSchema = new mongoose.Schema({
  reminderMsg: String,
  remindAt:String,
  isReminded: Boolean,
});

const Reminder = mongoose.model('reminder', reminderSchema);

 //whatsapp reminder funtionality

 setInterval(async () => {
  try {
    const reminderList = await Reminder.find().exec();
    reminderList.forEach(async (reminder) => {
      if (!reminder.isReminded) {
        const now = new Date();
        if (new Date(reminder.remindAt) - now < 0) {
          const remindObj = await Reminder.findByIdAndUpdate(reminder._id, { isReminded: true }).exec();
          // send msg
          const accountSid = process.env.ACCOUNT_SID;
          const authToken = process.env.AUTHTOKEN;
          const client = require('twilio')(accountSid, authToken);

          const message = await client.messages.create({
            body: reminder.reminderMsg,
            from: 'whatsapp:+14155238886',
            to: 'whatsapp:+917567215954'
          });

          console.log(message.sid);
        }
      }
    });
  } catch (err) {
    console.log(err);
  }
}, 1000);
  



// API Routes

app.get('/getAllReminder', async (req, res) => {
  try {
    const reminderList = await Reminder.find({});
    res.send(reminderList);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

app.post('/addReminder', async (req, res) => {
  try {
    const { reminderMsg, remindAt } = req.body;
    const reminder = new Reminder({
      reminderMsg,
      remindAt,
      isReminded: false,
    });

    await reminder.save();
    const reminderList = await Reminder.find({});
    res.send(reminderList);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

app.post('/deleteReminder', async (req, res) => {
  try {
    await Reminder.deleteOne({ _id: req.body.id });
    const reminderList = await Reminder.find({});
    res.send(reminderList);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

app.get('/', (req, res) => {
  res.send('<h1>BE started</h1>');
});

app.listen(8000, () => {
  console.log('app listen on port: 8000');
});
