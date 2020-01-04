const mongoClient = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

// Connect to MongoDB
mongoClient.connect(
    'mongodb://127.0.0.1/mongochat', {useUnifiedTopology: true},
    (err, client) => {
      if (err) {
        throw err;
      }
      console.log('MongoDB Connected...');

      // Select Database
      var db = client.db('mongochat');

      // Connect to Socket.io
      client.on('connection', (socket) => {
        let chat = db.collection('chats');

        // Create function to send status
        sendStatus = s => {
          socket.emit('status', s);
        };

        // Get chats from mongo collection
        chat.find().limit(100).sort({_id: 1}).toArray((err, res) => {
          if (err) {
            throw err;
          }
          // emit the messages
          console.log(res);

          socket.emit('output', res);
        });

        // Handle inputs
        socket.on('input', data => {
          let name = data.name;
          let message = data.message;

          // check for name & message
          if (name == '' || message == '') {
            // send error status
            sendStatus('Please enter a name and a message.');
          } else {
            // Insert message
            chat.insertOne({name: name, message: message}, () => {
              client.emit('output', [data]);

              // Send status object
              sendStatus({message: 'Message sent', clear: true});
            });
          }
        });

        // Handle clear
        socket.on('clear', data => {
          // Remove all chats from the collection
          chat.remove({}, () => {
            // Emit Cleared
            socket.emit('cleared');
          });
        });
      });
    });
