import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import mongooose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer(app);
const io = new Server(httpServer);

const __dirname = path.resolve();

const PORT = 3000;

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const dbURL = process.env.DB;

const Message = mongooose.model('Message', {
  name: String,
  message: String,
});

app.get('/messages', (req, res) => {
  Message.find({}, (err, messages) => {
    res.send(messages);
  });
});

app.get('/messages/:user', (req, res) => {
  const user = req.params.user;

  Message.find({ name: user }, (err, messages) => {
    res.send(messages);
  });
});

app.post('/messages', async (req, res) => {
  try {
    const message = new Message(req.body);

    const savedMessage = await message.save();

    const censored = await Message.findOne({ message: 'badword' });

    if (censored) {
      console.log('Censored words found.', censored);
      await Message.deleteOne({ _id: censored.id });
    } else {
      io.emit('message', req.body);
    }
    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(500);
    return console.error(error);
  } finally {
    console.log('Message post called');
  }
});

io.on('connection', socket => {
  console.log('A user connected');
});

mongooose.connect(
  dbURL,
  { useNewUrlParser: true, useUnifiedTopology: true },
  err => {
    console.log('MongoDB is connected');
    if (err) console.log(err);
  }
);

httpServer.listen(PORT, () => {
  console.log(`Server is listening to port: ${PORT}`);
});
