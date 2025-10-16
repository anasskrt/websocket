const { createServer } = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const gameState = {
  users: new Map(),
  score: {
    global: 0,
    lastUpdate: new Date(),
    contributors: []
  },
  messages: []
};

const ADMIN_TOKEN = 'boom-admin';

function createUser(userData, socketId, isFirstUser) {
  return {
    id: uuidv4(),
    name: userData.name,
    avatar: userData.avatar,
    isAdmin: isFirstUser,
    connectedAt: new Date(),
    lastActivity: new Date(),
    socketId: socketId
  };
}

function assignAdminToOldestUser() {
  const users = Array.from(gameState.users.values());
  if (users.length > 0) {
    users.sort((a, b) => new Date(a.connectedAt).getTime() - new Date(b.connectedAt).getTime());
    users.forEach((user, index) => {
      user.isAdmin = index === 0;
    });
  }
}

function broadcastUsersList() {
  const users = Array.from(gameState.users.values());
  console.log(`Broadcasting users list to all clients: ${users.length} users`);
  users.forEach(u => console.log(`  - ${u.name} (admin: ${u.isAdmin})`));
  io.emit('users:list', users);
}

function updateScore(points, userId, userName) {
  gameState.score.global += points;
  gameState.score.lastUpdate = new Date();
  
  const existingContributor = gameState.score.contributors.find(c => c.userId === userId);
  if (existingContributor) {
    existingContributor.points += points;
  } else {
    gameState.score.contributors.push({
      userId: userId,
      userName: userName,
      points: points
    });
  }
}

function createMessage(content, sender, type = 'global', recipient = null) {
  return {
    id: uuidv4(),
    type: type,
    content: content,
    sender: sender,
    recipient: recipient,
    timestamp: new Date()
  };
}



function validateMessage(content) {
  return content && 
         typeof content === 'string' && 
         content.trim().length > 0 && 
         content.length <= 500;
}

io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);

  socket.on('user:join', (userData) => {
    try {
      if (!userData.name || userData.name.length < 3 || userData.name.length > 20) {
        socket.emit('error', 'Nom invalide. Doit contenir entre 3 et 20 caractères.');
        return;
      }

      const existingUser = Array.from(gameState.users.values())
        .find(user => user.name.toLowerCase() === userData.name.toLowerCase());
      
      if (existingUser) {
        socket.emit('error', 'Ce nom est déjà utilisé. Choisissez un autre nom.');
        return;
      }

      const isFirstUser = gameState.users.size === 0;
      const user = createUser(userData, socket.id, isFirstUser);
      gameState.users.set(socket.id, user);

      console.log(`User ${user.name} created, total users: ${gameState.users.size}`);

      socket.emit('user:joined', user);

      setTimeout(() => {
        const allUsers = Array.from(gameState.users.values());
        console.log(`Sending user list to ${user.name}: ${allUsers.length} users`);
        allUsers.forEach(u => console.log(`  - ${u.name} (admin: ${u.isAdmin})`));
        
        socket.emit('users:list', allUsers);
        socket.broadcast.emit('users:list', allUsers);
      }, 100);
      
      const recentMessages = gameState.messages.slice(-50);
      recentMessages.forEach(message => {
        if (message.type === 'private') {
          if (message.sender.id === user.id || (message.recipient && message.recipient.id === user.id)) {
            socket.emit('message:received', message);
          }
        } else {
          socket.emit('message:received', message);
        }
      });

      socket.emit('score:updated', gameState.score);

      const systemMessage = createMessage(
        `${user.name} a rejoint la partie !`,
        user,
        'system'
      );
      gameState.messages.push(systemMessage);
      socket.broadcast.emit('message:received', systemMessage);

      updateScore(10, user.id, user.name);
      io.emit('score:updated', gameState.score);

      console.log(`User joined: ${user.name} (${user.id}), isAdmin: ${user.isAdmin}`);

    } catch (error) {
      console.error('Error in user:join:', error);
      socket.emit('error', 'Erreur lors de la connexion');
    }
  });

  socket.on('message:global', (content) => {
    try {
      const user = gameState.users.get(socket.id);
      if (!user) {
        socket.emit('error', 'Utilisateur non connecté');
        return;
      }

      if (!validateMessage(content)) {
        socket.emit('error', 'Message invalide');
        return;
      }

      const message = createMessage(content.trim(), user, 'global');
      gameState.messages.push(message);

      updateScore(1, user.id, user.name);
      user.lastActivity = new Date();

      io.emit('message:received', message);
      io.emit('score:updated', gameState.score);

      console.log(`Global message from ${user.name}: ${content}`);

    } catch (error) {
      console.error('Error in message:global:', error);
      socket.emit('error', 'Erreur lors de l\'envoi du message');
    }
  });

  socket.on('message:private', (content, recipientId) => {
    try {
      const sender = gameState.users.get(socket.id);
      if (!sender) {
        socket.emit('error', 'Utilisateur non connecté');
        return;
      }

      if (!validateMessage(content)) {
        socket.emit('error', 'Message invalide');
        return;
      }

      const recipient = Array.from(gameState.users.values())
        .find(user => user.id === recipientId);
      
      if (!recipient) {
        socket.emit('error', 'Destinataire introuvable');
        return;
      }

      const message = createMessage(content.trim(), sender, 'private', recipient);

      socket.emit('message:received', message);
      io.to(recipient.socketId).emit('message:received', message);

      console.log(`Private message from ${sender.name} to ${recipient.name}: ${content}`);

    } catch (error) {
      console.error('Error in message:private:', error);
      socket.emit('error', 'Erreur lors de l\'envoi du message privé');
    }
  });

  socket.on('game:action', (actionType, data) => {
    try {
      const user = gameState.users.get(socket.id);
      if (!user) {
        socket.emit('error', 'Utilisateur non connecté');
        return;
      }

      let points = 0;
      switch (actionType) {
        case 'Boom Click':
          points = 5;
          break;
        case 'Super Boom':
          points = 15;
          break;
        case 'Mega Blast':
          points = 25;
          break;
        case 'Bonus Star':
          points = 10;
          break;
        default:
          points = data.points || 5;
      }

      updateScore(points, user.id, user.name);
      user.lastActivity = new Date();
      io.emit('score:updated', gameState.score);
      console.log(`Game action from ${user.name}: ${actionType} (+${points} points)`);

    } catch (error) {
      console.error('Error in game:action:', error);
      socket.emit('error', 'Erreur lors de l\'action de jeu');
    }
  });

  socket.on('admin:kick', (userId) => {
    try {
      const admin = gameState.users.get(socket.id);
      if (!admin || !admin.isAdmin) {
        socket.emit('error', 'Action non autorisée');
        return;
      }

      const userToKick = Array.from(gameState.users.values())
        .find(user => user.id === userId);
      
      if (userToKick) {
        io.to(userToKick.socketId).emit('admin:notification', 'Vous avez été déconnecté par un administrateur');
        io.to(userToKick.socketId).disconnect(true);
        
        console.log(`Admin ${admin.name} kicked user ${userToKick.name}`);
      }

    } catch (error) {
      console.error('Error in admin:kick:', error);
    }
  });

  socket.on('admin:reset-score', () => {
    try {
      const admin = gameState.users.get(socket.id);
      if (!admin || !admin.isAdmin) {
        socket.emit('error', 'Action non autorisée');
        return;
      }

      gameState.score = {
        global: 0,
        lastUpdate: new Date(),
        contributors: []
      };

      io.emit('score:updated', gameState.score);
      io.emit('admin:notification', 'Le score global a été remis à zéro par un administrateur');

      console.log(`Admin ${admin.name} reset the global score`);

    } catch (error) {
      console.error('Error in admin:reset-score:', error);
    }
  });

  socket.on('disconnect', (reason) => {
    try {
      const user = gameState.users.get(socket.id);
      if (user) {
        const wasAdmin = user.isAdmin;
        gameState.users.delete(socket.id);

        if (wasAdmin && gameState.users.size > 0) {
          assignAdminToOldestUser();
        }

        const systemMessage = createMessage(
          `${user.name} a quitté la partie.`,
          user,
          'system'
        );
        gameState.messages.push(systemMessage);
        socket.broadcast.emit('message:received', systemMessage);

        broadcastUsersList();

        updateScore(-5, user.id, user.name);
        io.emit('score:updated', gameState.score);

        console.log(`User disconnected: ${user.name} (${reason})`);
      }
    } catch (error) {
      console.error('Error in disconnect:', error);
    }
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🎮 BoomParty Socket.io server running on port ${PORT}`);
  console.log(`🔗 CORS enabled for: http://localhost:3000`);
  console.log(`🎯 Admin token: ${ADMIN_TOKEN}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Shutting down server...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});