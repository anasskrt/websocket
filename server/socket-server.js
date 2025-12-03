const { createServer } = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const frenchWords = require("an-array-of-french-words");

const frenchWordsSet = new Set(frenchWords.map((word) => word.toUpperCase()));

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const gameState = {
  users: new Map(),
  messages: [],
  game: {
    isActive: false,
    status: "waiting",
    players: [],
    bombState: {
      currentLetter: "",
      timeRemaining: 0,
      maxTime: 0,
      activePlayerId: null,
      usedWords: [],
      roundNumber: 0,
      lastWordLength: 0,
      timeWhenWordSubmitted: 0,
    },
    winner: null,
    settings: {
      baseTime: 30,
      startingLives: 3,
    },
  },
  bombTimer: null,
};

function createUser(userData, socketId, isFirstUser) {
  return {
    id: uuidv4(),
    name: userData.name,
    avatar: userData.avatar,
    isAdmin: isFirstUser,
    connectedAt: new Date(),
    lastActivity: new Date(),
    socketId: socketId,
  };
}

function assignAdminToOldestUser() {
  const users = Array.from(gameState.users.values());
  if (users.length > 0) {
    users.sort(
      (a, b) =>
        new Date(a.connectedAt).getTime() - new Date(b.connectedAt).getTime()
    );
    users.forEach((user, index) => {
      user.isAdmin = index === 0;
    });
  }
}

function broadcastUsersList() {
  const users = Array.from(gameState.users.values());
  console.log(`Broadcasting users list to all clients: ${users.length} users`);
  users.forEach((u) => console.log(`  - ${u.name} (admin: ${u.isAdmin})`));
  io.emit("users:list", users);
}

function createMessage(content, sender, type = "global", recipient = null) {
  return {
    id: uuidv4(),
    type: type,
    content: content,
    sender: sender,
    recipient: recipient,
    timestamp: new Date(),
  };
}

function validateMessage(content) {
  return (
    content &&
    typeof content === "string" &&
    content.trim().length > 0 &&
    content.length <= 500
  );
}

const COMBINAISONS = [
  "AB",
  "AC",
  "AD",
  "AG",
  "AI",
  "AL",
  "AM",
  "AN",
  "AP",
  "AR",
  "AS",
  "AT",
  "AU",
  "AV",
  "BA",
  "BE",
  "BI",
  "BO",
  "BU",
  "CA",
  "CE",
  "CH",
  "CI",
  "CO",
  "CR",
  "CU",
  "DA",
  "DE",
  "DI",
  "DO",
  "DU",
  "EC",
  "ED",
  "EF",
  "EL",
  "EM",
  "EN",
  "EP",
  "ER",
  "ES",
  "ET",
  "EU",
  "EV",
  "EX",
  "FA",
  "FE",
  "FI",
  "FL",
  "FO",
  "FR",
  "FU",
  "GA",
  "GE",
  "GI",
  "GO",
  "GR",
  "GU",
  "HA",
  "HE",
  "HI",
  "HO",
  "HU",
  "ID",
  "IL",
  "IM",
  "IN",
  "IR",
  "IS",
  "IT",
  "JA",
  "JE",
  "JO",
  "JU",
  "LA",
  "LE",
  "LI",
  "LO",
  "LU",
  "MA",
  "ME",
  "MI",
  "MO",
  "MU",
  "NA",
  "NE",
  "NI",
  "NO",
  "NU",
  "OB",
  "OC",
  "OD",
  "OF",
  "OI",
  "OM",
  "ON",
  "OP",
  "OR",
  "OS",
  "OU",
  "OV",
  "PA",
  "PE",
  "PH",
  "PI",
  "PL",
  "PO",
  "PR",
  "PU",
  "QU",
  "RA",
  "RE",
  "RI",
  "RO",
  "RU",
  "SA",
  "SE",
  "SI",
  "SO",
  "SU",
  "TA",
  "TE",
  "TI",
  "TO",
  "TR",
  "TU",
  "UN",
  "UR",
  "US",
  "UT",
  "VA",
  "VE",
  "VI",
  "VO",
  "VU",
  "ZE",
  "ZO",
  "AIR",
  "ANC",
  "ANT",
  "ART",
  "ATE",
  "AUX",
  "BLE",
  "BRA",
  "BRE",
  "BRI",
  "BRO",
  "BRU",
  "CHA",
  "CHE",
  "CHI",
  "CHO",
  "CHU",
  "CLA",
  "COM",
  "CON",
  "COU",
  "CRA",
  "CRE",
  "CRI",
  "DAN",
  "DER",
  "DES",
  "DEV",
  "DIS",
  "DIV",
  "DRA",
  "DRE",
  "DRO",
  "ENT",
  "ERA",
  "ERE",
  "ERI",
  "ERS",
  "ERT",
  "EUR",
  "EVE",
  "FER",
  "FLA",
  "FLE",
  "FLO",
  "FOR",
  "FRA",
  "FRE",
  "FRO",
  "GRA",
  "GRE",
  "GRI",
  "GRO",
  "GUE",
  "HAB",
  "HAU",
  "HER",
  "HOM",
  "HOR",
  "INT",
  "ION",
  "IRE",
  "JOU",
  "JUR",
  "LAN",
  "LEU",
  "LIE",
  "LOU",
  "LUM",
  "MAI",
  "MAN",
  "MAR",
  "MEN",
  "MER",
  "MIS",
  "MON",
  "MOR",
  "MOU",
  "NAT",
  "NOU",
  "OBJ",
  "OIS",
  "OMB",
  "OMP",
  "OND",
  "ONT",
  "OPE",
  "ORT",
  "OUB",
  "OUR",
  "OUT",
  "OUV",
  "PAR",
  "PAS",
  "PEN",
  "PER",
  "PEU",
  "PLA",
  "PLE",
  "PLI",
  "PLU",
  "POI",
  "POR",
  "POU",
  "PRA",
  "PRE",
  "PRI",
  "PRO",
  "QUA",
  "QUE",
  "QUI",
  "RAN",
  "RAP",
  "REC",
  "REN",
  "REP",
  "RES",
  "RET",
  "REV",
  "RIE",
  "ROU",
  "SAI",
  "SAN",
  "SAU",
  "SEM",
  "SEN",
  "SER",
  "SOU",
  "SUR",
  "TAN",
  "TEM",
  "TEN",
  "TER",
  "TIO",
  "TOR",
  "TOU",
  "TRA",
  "TRE",
  "TRI",
  "TRO",
  "TRU",
  "UNI",
  "VEN",
  "VER",
  "VIE",
  "VIN",
  "VIR",
  "VOI",
  "VOU",
  "VRA",
  "VRE",
  "ZON",
];

let validatedCombinations = null;

function getValidatedCombinations() {
  if (validatedCombinations) return validatedCombinations;

  console.log("Validation des combinaisons avec le dictionnaire...");
  validatedCombinations = COMBINAISONS.filter((combo) => {
    const wordsWithCombo = Array.from(frenchWordsSet).filter(
      (word) => word.includes(combo) && word.length >= 4
    );
    const isValid = wordsWithCombo.length >= 10;
    if (isValid) {
      console.log(`${combo}: ${wordsWithCombo.length} mots`);
    }
    return isValid;
  });

  console.log(
    `${validatedCombinations.length}/${COMBINAISONS.length} combinaisons validées`
  );
  return validatedCombinations;
}

function getRandomSyllabe() {
  const validated = getValidatedCombinations();
  return validated[Math.floor(Math.random() * validated.length)];
}

function calculateBombTime(
  roundNumber,
  settings,
  lastWordLength = 0,
  lastTimeUsed = 0
) {
  const baseTime = settings.baseTime;

  let calculatedTime = baseTime - Math.floor((roundNumber - 1) * 1.5);

  if (lastWordLength > 0) {
    if (lastWordLength >= 8) {
      calculatedTime -= 3;
    } else if (lastWordLength >= 6) {
      calculatedTime -= 2;
    } else if (lastWordLength <= 4) {
      calculatedTime += 2;
    }
  }

  if (lastTimeUsed > 0) {
    const percentageUsed = (lastTimeUsed / baseTime) * 100;
    if (percentageUsed < 30) {
      calculatedTime -= 3;
    }
  }

  return Math.max(5, calculatedTime);
}

function removeAccents(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function checkWordExists(word) {
  const normalizedWord = removeAccents(word.toUpperCase().trim());
  return frenchWordsSet.has(normalizedWord);
}

function validateWord(word, syllabe, usedWords) {
  const normalizedWord = removeAccents(word.toUpperCase().trim());
  const normalizedSyllabe = removeAccents(syllabe.toUpperCase());

  if (normalizedWord.length < 4) {
    return { valid: false, reason: "Le mot doit contenir au moins 4 lettres" };
  }

  if (!normalizedWord.includes(normalizedSyllabe)) {
    return {
      valid: false,
      reason: `Le mot doit contenir "${syllabe}"`,
    };
  }

  if (usedWords && usedWords.includes(normalizedWord)) {
    return { valid: false, reason: "Ce mot a déjà été utilisé" };
  }

  if (!checkWordExists(normalizedWord)) {
    return { valid: false, reason: "Ce mot n'existe pas dans le dictionnaire" };
  }

  return { valid: true };
}

function initializeGame() {
  const users = Array.from(gameState.users.values());
  const alivePlayers = users.filter((u) => u.isAlive !== false);

  gameState.game = {
    isActive: true,
    status: "playing",
    players: users.map((user) => ({
      ...user,
      lives: gameState.game.settings.startingLives,
      isAlive: true,
    })),
    bombState: {
      currentLetter: getRandomSyllabe(),
      timeRemaining: gameState.game.settings.baseTime,
      maxTime: gameState.game.settings.baseTime,
      activePlayerId: alivePlayers[0]?.id || users[0]?.id,
      usedWords: [],
      roundNumber: 1,
      lastWordLength: 0,
      timeWhenWordSubmitted: 0,
    },
    winner: null,
    settings: gameState.game.settings,
  };

  users.forEach((user) => {
    user.lives = gameState.game.settings.startingLives;
    user.isAlive = true;
    gameState.users.set(user.socketId, user);
  });

  startBombTimer();
  broadcastGameState();
}

function startBombTimer() {
  if (gameState.bombTimer) {
    clearInterval(gameState.bombTimer);
  }

  gameState.bombTimer = setInterval(() => {
    if (gameState.game.status !== "playing") {
      clearInterval(gameState.bombTimer);
      return;
    }

    gameState.game.bombState.timeRemaining--;

    io.emit("game:bomb-tick", gameState.game.bombState.timeRemaining);

    if (gameState.game.bombState.timeRemaining <= 0) {
      handleExplosion();
    }
  }, 1000);
}

function handleExplosion() {
  clearInterval(gameState.bombTimer);

  const activePlayerId = gameState.game.bombState.activePlayerId;
  const playerIndex = gameState.game.players.findIndex(
    (p) => p.id === activePlayerId
  );

  if (playerIndex !== -1) {
    const player = gameState.game.players[playerIndex];
    player.lives = (player.lives || 0) - 1;

    const userEntry = Array.from(gameState.users.entries()).find(
      ([, u]) => u.id === player.id
    );
    if (userEntry) {
      userEntry[1].lives = player.lives;
      if (player.lives <= 0) {
        player.isAlive = false;
        userEntry[1].isAlive = false;
      }
      gameState.users.set(userEntry[0], userEntry[1]);
    }

    io.emit("game:explosion", activePlayerId);

    const systemMessage = createMessage(
      `${player.name} n'a pas trouvé de mot à temps ! ${
        player.lives > 0 ? `Il reste ${player.lives} vie(s)` : "Éliminé!"
      }`,
      player,
      "system"
    );
    gameState.messages.push(systemMessage);
    io.emit("message:received", systemMessage);

    gameState.game.players[playerIndex] = player;

    const alivePlayers = gameState.game.players.filter((p) => p.isAlive);

    if (alivePlayers.length <= 1) {
      endGame(alivePlayers[0] || null);
      return;
    }

    nextPlayer();
  }
}

function nextPlayer() {
  const alivePlayers = gameState.game.players.filter((p) => p.isAlive);

  if (alivePlayers.length === 0) {
    endGame(null);
    return;
  }

  const currentIndex = alivePlayers.findIndex(
    (p) => p.id === gameState.game.bombState.activePlayerId
  );
  const nextIndex = (currentIndex + 1) % alivePlayers.length;

  gameState.game.bombState.activePlayerId = alivePlayers[nextIndex].id;
  gameState.game.bombState.currentLetter = getRandomSyllabe();

  const newTime = calculateBombTime(
    gameState.game.bombState.roundNumber + 1,
    gameState.game.settings,
    gameState.game.bombState.lastWordLength,
    gameState.game.bombState.timeWhenWordSubmitted
  );

  gameState.game.bombState.timeRemaining = newTime;
  gameState.game.bombState.maxTime = newTime;
  gameState.game.bombState.roundNumber++;

  broadcastGameState();
  startBombTimer();
}

function endGame(winner) {
  clearInterval(gameState.bombTimer);

  gameState.game.status = "finished";
  gameState.game.winner = winner;
  gameState.game.isActive = false;

  const systemMessage = createMessage(
    winner ? `${winner.name} remporte la partie !` : "Partie terminée",
    winner || gameState.game.players[0],
    "system"
  );
  gameState.messages.push(systemMessage);
  io.emit("message:received", systemMessage);

  broadcastGameState();
}

function stopGame() {
  clearInterval(gameState.bombTimer);

  gameState.game.status = "waiting";
  gameState.game.isActive = false;
  gameState.game.winner = null;
  gameState.game.bombState = {
    currentLetter: "",
    timeRemaining: 0,
    maxTime: 0,
    activePlayerId: null,
    usedWords: [],
    roundNumber: 0,
    lastWordLength: 0,
    timeWhenWordSubmitted: 0,
  };

  Array.from(gameState.users.values()).forEach((user) => {
    user.lives = gameState.game.settings.startingLives;
    user.isAlive = true;
  });

  broadcastGameState();
}

function broadcastGameState() {
  const users = Array.from(gameState.users.values());
  gameState.game.players = users.map((user) => ({
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    isAdmin: user.isAdmin,
    connectedAt: user.connectedAt,
    lastActivity: user.lastActivity,
    lives: user.lives || gameState.game.settings.startingLives,
    isAlive: user.isAlive !== false,
    socketId: user.socketId,
  }));

  io.emit("game:updated", gameState.game);
}

io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);

  socket.on("user:join", (userData) => {
    try {
      if (
        !userData.name ||
        userData.name.length < 3 ||
        userData.name.length > 20
      ) {
        socket.emit(
          "error",
          "Nom invalide. Doit contenir entre 3 et 20 caractères."
        );
        return;
      }

      const existingUser = Array.from(gameState.users.values()).find(
        (user) => user.name.toLowerCase() === userData.name.toLowerCase()
      );

      if (existingUser) {
        socket.emit(
          "error",
          "Ce nom est déjà utilisé. Choisissez un autre nom."
        );
        return;
      }

      const isFirstUser = gameState.users.size === 0;
      const user = createUser(userData, socket.id, isFirstUser);
      gameState.users.set(socket.id, user);

      console.log(
        `User ${user.name} created, total users: ${gameState.users.size}`
      );

      socket.emit("user:joined", user);

      setTimeout(() => {
        const allUsers = Array.from(gameState.users.values());
        console.log(
          `Sending user list to ${user.name}: ${allUsers.length} users`
        );
        allUsers.forEach((u) =>
          console.log(`  - ${u.name} (admin: ${u.isAdmin})`)
        );

        socket.emit("users:list", allUsers);
        socket.broadcast.emit("users:list", allUsers);

        broadcastGameState();
      }, 100);

      const recentMessages = gameState.messages.slice(-50);
      recentMessages.forEach((message) => {
        if (message.type === "private") {
          if (
            message.sender.id === user.id ||
            (message.recipient && message.recipient.id === user.id)
          ) {
            socket.emit("message:received", message);
          }
        } else {
          socket.emit("message:received", message);
        }
      });

      const systemMessage = createMessage(
        `${user.name} a rejoint le chat !`,
        user,
        "system"
      );
      gameState.messages.push(systemMessage);
      socket.broadcast.emit("message:received", systemMessage);

      console.log(
        `User joined: ${user.name} (${user.id}), isAdmin: ${user.isAdmin}`
      );
    } catch (error) {
      console.error("Error in user:join:", error);
      socket.emit("error", "Erreur lors de la connexion");
    }
  });

  socket.on("message:global", (content) => {
    try {
      const user = gameState.users.get(socket.id);
      if (!user) {
        socket.emit("error", "Utilisateur non connecté");
        return;
      }

      if (!validateMessage(content)) {
        socket.emit("error", "Message invalide");
        return;
      }

      const message = createMessage(content.trim(), user, "global");
      gameState.messages.push(message);

      user.lastActivity = new Date();

      io.emit("message:received", message);

      console.log(`Global message from ${user.name}: ${content}`);
    } catch (error) {
      console.error("Error in message:global:", error);
      socket.emit("error", "Erreur lors de l'envoi du message");
    }
  });

  socket.on("message:private", (content, recipientId) => {
    try {
      const sender = gameState.users.get(socket.id);
      if (!sender) {
        socket.emit("error", "Utilisateur non connecté");
        return;
      }

      if (!validateMessage(content)) {
        socket.emit("error", "Message invalide");
        return;
      }

      const recipient = Array.from(gameState.users.values()).find(
        (user) => user.id === recipientId
      );

      if (!recipient) {
        socket.emit("error", "Destinataire introuvable");
        return;
      }

      const message = createMessage(
        content.trim(),
        sender,
        "private",
        recipient
      );

      socket.emit("message:received", message);
      io.to(recipient.socketId).emit("message:received", message);

      console.log(
        `Private message from ${sender.name} to ${recipient.name}: ${content}`
      );
    } catch (error) {
      console.error("Error in message:private:", error);
      socket.emit("error", "Erreur lors de l'envoi du message privé");
    }
  });

  socket.on("admin:kick", (userId) => {
    try {
      const admin = gameState.users.get(socket.id);
      if (!admin || !admin.isAdmin) {
        socket.emit("error", "Action non autorisée");
        return;
      }

      const userToKick = Array.from(gameState.users.values()).find(
        (user) => user.id === userId
      );

      if (userToKick) {
        const socketToKick = io.sockets.sockets.get(userToKick.socketId);

        if (socketToKick) {
          gameState.users.delete(userToKick.socketId);

          const systemMessage = createMessage(
            `${userToKick.name} a été expulsé par ${admin.name}`,
            admin,
            "system"
          );
          gameState.messages.push(systemMessage);
          io.emit("message:received", systemMessage);

          broadcastUsersList();

          if (gameState.game.status === "playing") {
            const remainingUsers = Array.from(gameState.users.values());
            if (remainingUsers.length < 2) {
              stopGame();
              const gameStopMessage = createMessage(
                "⏹️ Partie arrêtée : pas assez de joueurs",
                admin,
                "system"
              );
              gameState.messages.push(gameStopMessage);
              io.emit("message:received", gameStopMessage);
            } else {
              const alivePlayers = gameState.game.players.filter(
                (p) => p.isAlive && gameState.users.has(p.socketId)
              );
              if (alivePlayers.length <= 1) {
                endGame(alivePlayers[0] || null);
              }
            }
          }

          socketToKick.emit(
            "error",
            "Vous avez été expulsé par un administrateur"
          );

          setTimeout(() => {
            socketToKick.disconnect(true);
          }, 100);

          console.log(`Admin ${admin.name} kicked user ${userToKick.name}`);
        }
      }
    } catch (error) {
      console.error("Error in admin:kick:", error);
    }
  });

  socket.on("game:start", () => {
    try {
      const admin = gameState.users.get(socket.id);
      if (!admin || !admin.isAdmin) {
        socket.emit("error", "Seul l'admin peut démarrer la partie");
        return;
      }

      const users = Array.from(gameState.users.values());
      if (users.length < 2) {
        socket.emit("error", "Il faut au moins 2 joueurs pour démarrer");
        return;
      }

      initializeGame();

      const systemMessage = createMessage(
        `${admin.name} a démarré une partie de Tic Tac Boom !`,
        admin,
        "system"
      );
      gameState.messages.push(systemMessage);
      io.emit("message:received", systemMessage);

      console.log(`Game started by ${admin.name}`);
    } catch (error) {
      console.error("Error in game:start:", error);
      socket.emit("error", "Erreur lors du démarrage de la partie");
    }
  });

  socket.on("game:stop", () => {
    try {
      const admin = gameState.users.get(socket.id);
      if (!admin || !admin.isAdmin) {
        socket.emit("error", "Seul l'admin peut arrêter la partie");
        return;
      }

      stopGame();

      const systemMessage = createMessage(
        `${admin.name} a arrêté la partie`,
        admin,
        "system"
      );
      gameState.messages.push(systemMessage);
      io.emit("message:received", systemMessage);

      console.log(`Game stopped by ${admin.name}`);
    } catch (error) {
      console.error("Error in game:stop:", error);
      socket.emit("error", "Erreur lors de l'arrêt de la partie");
    }
  });

  socket.on("game:update-settings", (settings) => {
    try {
      const admin = gameState.users.get(socket.id);
      if (!admin || !admin.isAdmin) {
        socket.emit("error", "Seul l'admin peut modifier les paramètres");
        return;
      }

      if (gameState.game.status === "playing") {
        socket.emit(
          "error",
          "Impossible de modifier les paramètres pendant une partie"
        );
        return;
      }

      if (settings.baseTime < 10 || settings.baseTime > 60) {
        socket.emit("error", "Temps de base invalide (10-60s)");
        return;
      }

      if (settings.startingLives < 1 || settings.startingLives > 10) {
        socket.emit("error", "Nombre de vies invalide (1-10)");
        return;
      }

      gameState.game.settings = {
        baseTime: settings.baseTime,
        startingLives: settings.startingLives,
      };

      broadcastGameState();

      const systemMessage = createMessage(
        `${admin.name} a modifié les paramètres: ${settings.baseTime}s de base, ${settings.startingLives} vies`,
        admin,
        "system"
      );
      gameState.messages.push(systemMessage);
      io.emit("message:received", systemMessage);

      console.log(`Game settings updated by ${admin.name}:`, settings);
    } catch (error) {
      console.error("Error in game:update-settings:", error);
      socket.emit("error", "Erreur lors de la mise à jour des paramètres");
    }
  });

  socket.on("game:submit-word", (word) => {
    try {
      const user = gameState.users.get(socket.id);
      if (!user) {
        socket.emit("error", "Utilisateur non connecté");
        return;
      }

      if (gameState.game.status !== "playing") {
        socket.emit("error", "Aucune partie en cours");
        return;
      }

      if (user.id !== gameState.game.bombState.activePlayerId) {
        socket.emit("error", "Ce n'est pas votre tour");
        return;
      }

      const validation = validateWord(
        word,
        gameState.game.bombState.currentLetter,
        gameState.game.bombState.usedWords
      );

      if (!validation.valid) {
        socket.emit("game:word-rejected", validation.reason);

        const errorMessage = createMessage(
          `${user.name}: "${word}" - ${validation.reason}`,
          user,
          "system"
        );
        gameState.messages.push(errorMessage);
        io.emit("message:received", errorMessage);

        return;
      }

      gameState.game.bombState.usedWords.push(
        removeAccents(word.toUpperCase())
      );

      gameState.game.bombState.lastWordLength = word.length;
      gameState.game.bombState.timeWhenWordSubmitted =
        gameState.game.bombState.timeRemaining;

      const timeUsedPercent = (
        ((gameState.game.bombState.maxTime -
          gameState.game.bombState.timeRemaining) /
          gameState.game.bombState.maxTime) *
        100
      ).toFixed(0);
      const bonusInfo =
        word.length >= 8
          ? " 🎯 -3s pour l'adversaire!"
          : word.length >= 6
          ? " ⭐ -2s pour l'adversaire!"
          : word.length <= 4
          ? " ⚡ +2s pour l'adversaire!"
          : "";
      const speedInfo =
        timeUsedPercent < 30 ? " 🔥 Trop rapide! -3s pour l'adversaire!" : "";

      const successMessage = createMessage(
        `${
          user.name
        } a trouvé: "${word.toUpperCase()}"${bonusInfo}${speedInfo}`,
        user,
        "system"
      );
      gameState.messages.push(successMessage);
      io.emit("message:received", successMessage);

      clearInterval(gameState.bombTimer);
      nextPlayer();

      console.log(`${user.name} submitted valid word: ${word}`);
    } catch (error) {
      console.error("Error in game:submit-word:", error);
      socket.emit("error", "Erreur lors de la soumission du mot");
    }
  });

  socket.on("disconnect", (reason) => {
    try {
      const user = gameState.users.get(socket.id);
      if (user) {
        const wasAdmin = user.isAdmin;
        gameState.users.delete(socket.id);

        if (wasAdmin && gameState.users.size > 0) {
          assignAdminToOldestUser();
        }

        const systemMessage = createMessage(
          `${user.name} a quitté le chat.`,
          user,
          "system"
        );
        gameState.messages.push(systemMessage);
        socket.broadcast.emit("message:received", systemMessage);

        broadcastUsersList();

        if (gameState.game.status === "playing") {
          const remainingUsers = Array.from(gameState.users.values());
          if (remainingUsers.length < 2) {
            stopGame();
            const gameStopMessage = createMessage(
              "⏹️ Partie arrêtée : pas assez de joueurs",
              remainingUsers[0] || user,
              "system"
            );
            gameState.messages.push(gameStopMessage);
            io.emit("message:received", gameStopMessage);
          } else {
            const alivePlayers = gameState.game.players.filter(
              (p) => p.isAlive && gameState.users.has(p.socketId)
            );
            if (alivePlayers.length <= 1) {
              endGame(alivePlayers[0] || null);
            }
          }
        }

        console.log(`User disconnected: ${user.name} (${reason})`);
      }
    } catch (error) {
      console.error("Error in disconnect:", error);
    }
  });
});

const PORT = 3001;

httpServer.listen(PORT, () => {
  console.log(`BoomParty Chat Socket.io server running on port ${PORT}`);
});