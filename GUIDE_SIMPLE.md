# 🎮 Guide Simple - BoomParty

## 📖 Présentation Générale

**BoomParty** est un jeu multijoueur en temps réel où les joueurs doivent trouver des mots contenant une syllabe avant que la bombe n'explose.

---

## 🗂️ Structure du Projet

```
boomparty/
├── server/                    # SERVEUR (Backend)
│   └── socket-server.js      # Gère toute la logique du jeu
│
├── src/
│   ├── app/                   # PAGES NEXT.JS
│   │   ├── layout.tsx        # Structure HTML globale
│   │   ├── page.tsx          # Page d'accueil (point d'entrée)
│   │   └── globals.css       # Styles globaux
│   │
│   ├── components/            # COMPOSANTS REACT
│   │   ├── LoginForm.tsx     # Formulaire de connexion
│   │   ├── GameRoom.tsx      # Salle de jeu principale
│   │   ├── GameArea.tsx      # Zone de jeu (bombe + timer)
│   │   ├── GameHeader.tsx    # En-tête (infos partie)
│   │   ├── UsersList.tsx     # Liste des joueurs
│   │   ├── ChatArea.tsx      # Zone de chat
│   │   └── GameSettings.tsx  # Paramètres (admin)
│   │
│   └── lib/                   # UTILITAIRES
│       ├── socket.ts         # Gestion Socket.IO
│       ├── types.ts          # Définitions TypeScript
│       └── utils.ts          # Fonctions utiles
│
└── public/                    # FICHIERS STATIQUES
    └── avatars/              # Images des avatars
```

---

## 🔧 SERVEUR

### 📄 `server/socket-server.js`

**Rôle** : C'est le cerveau de l'application. Il gère tout ce qui se passe dans le jeu.

#### Ce qu'il fait :

1. **Connexion des joueurs**
   - Crée un ID unique pour chaque joueur
   - Enregistre les noms
   - Désigne le premier joueur comme admin

2. **Gestion de la partie**
   - Démarre le jeu quand l'admin lance
   - Tire les syllabes aléatoirement
   - Fait tourner le tour entre les joueurs
   - Gère le timer de la bombe

3. **Validation des mots**
   - Vérifie que le mot contient la syllabe
   - Vérifie qu'il n'a pas déjà été utilisé
   - Vérifie qu'il existe dans le dictionnaire (300k mots français)
   - Ignore les accents (café = cafe)

4. **Calcul du temps dynamique**
   - Plus on avance dans la partie, moins on a de temps
   - Un mot long punit l'adversaire (-3s)
   - Un mot court aide l'adversaire (+2s)
   - Répondre trop vite punit l'adversaire (-3s)

5. **Gestion des vies**
   - Retire une vie quand la bombe explose
   - Élimine le joueur quand il n'a plus de vies
   - Déclare le gagnant quand il ne reste qu'un joueur

#### Fonctions importantes :

```javascript
// Valide un mot soumis par un joueur
validateWord(word, syllabe, usedWords)

// Calcule le temps pour le prochain tour
calculateBombTime(roundNumber, settings, lastWordLength, lastTimeUsed)

// Passe au joueur suivant
nextPlayer()

// Gère l'explosion de la bombe
playerExploded()

// Démarre une nouvelle partie
initializeGame()
```

---

## 🌐 CLIENT (Interface Web)

### 📄 `src/app/layout.tsx`

**Rôle** : Structure HTML de base pour toute l'application.

**Ce qu'il fait** :
- Définit la balise `<html>` et `<body>`
- Charge les polices de caractères
- Applique les styles globaux
- Enveloppe toutes les pages

**Code simplifié** :
```tsx
export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        {children}  {/* Les pages s'affichent ici */}
      </body>
    </html>
  );
}
```

---

### 📄 `src/app/page.tsx`

**Rôle** : Point d'entrée de l'application. Première page affichée.

**Ce qu'il fait** :
1. Se connecte au serveur Socket.IO au démarrage
2. Écoute les événements du serveur (nouveaux joueurs, changements de jeu, messages)
3. Affiche `LoginForm` si pas connecté
4. Affiche `GameRoom` si connecté

**Code simplifié** :
```tsx
export default function Home() {
  const [userId, setUserId] = useState(null);
  const [users, setUsers] = useState([]);
  const [game, setGame] = useState({...});
  const [messages, setMessages] = useState([]);

  // Connexion au démarrage
  useEffect(() => {
    socketManager.connect("http://localhost:3001");
    
    // Écoute les événements
    socketManager.on("user:connected", (data) => setUserId(data.userId));
    socketManager.on("users:list", (data) => setUsers(data.users));
    socketManager.on("game:state", (data) => setGame(data.game));
    socketManager.on("message:received", (msg) => setMessages([...messages, msg]));
  }, []);

  // Affichage conditionnel
  if (!userId) {
    return <LoginForm />;
  }

  return <GameRoom userId={userId} users={users} game={game} messages={messages} />;
}
```

**Flux** :
```
Utilisateur ouvre l'app
    ↓
Se connecte au serveur
    ↓
Pas de nom → Affiche LoginForm
    ↓
Nom entré → Affiche GameRoom
```

---

## 🎨 COMPOSANTS

### 📄 `src/components/LoginForm.tsx`

**Rôle** : Formulaire pour entrer son nom et se connecter.

**Affichage** :
```
┌────────────────────────┐
│   Bienvenue sur        │
│     BoomParty!         │
│                        │
│  [Entrez votre nom]    │
│                        │
│     [Se connecter]     │
└────────────────────────┘
```

**Code simplifié** :
```tsx
export default function LoginForm() {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (name.trim()) {
      socketManager.setName(name);  // Envoie le nom au serveur
    }
  };

  return (
    <div>
      <h1>Bienvenue sur BoomParty!</h1>
      <input 
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Votre nom"
      />
      <button onClick={handleSubmit}>Se connecter</button>
    </div>
  );
}
```

---

### 📄 `src/components/GameRoom.tsx`

**Rôle** : Conteneur principal une fois connecté. Organise tous les autres composants.

**Affichage** :
```
┌──────────────────────────────────────────────┐
│              GameHeader                       │
│  👥 3 joueurs | 🎮 En cours | ⚙️ Admin       │
├─────────────────┬────────────────────────────┤
│   UsersList     │        GameArea            │
│                 │                            │
│ 👤 Alice ❤️❤️❤️   │   ⏱️ 18s                  │
│ 👤 Bob ❤️❤️      │   💣 Syllabe: "RA"        │
│ 👤 Charlie 💀    │   📝 [Entrez un mot...]   │
│                 │                            │
├─────────────────┤                            │
│   ChatArea      │                            │
│                 │                            │
│ 💬 Alice: Salut │                            │
│ 💬 Bob: Go!     │                            │
│ 📝 [Message...] │                            │
└─────────────────┴────────────────────────────┘
┌──────────────────────────────────────────────┐
│           GameSettings (si admin)             │
│  ⏱️ Temps: [15s - 30s]  ❤️ Vies: [3]         │
│  [Démarrer la partie]                        │
└──────────────────────────────────────────────┘
```

**Code simplifié** :
```tsx
export default function GameRoom({ userId, users, game, messages }) {
  const currentUser = users.find(u => u.id === userId);
  const isAdmin = currentUser?.isAdmin || false;

  return (
    <div>
      {/* En-tête */}
      <GameHeader users={users} game={game} isAdmin={isAdmin} />
      
      <div className="main-layout">
        {/* Colonne gauche */}
        <aside>
          <UsersList users={users} game={game} currentUserId={userId} />
          <ChatArea messages={messages} currentUserId={userId} />
        </aside>
        
        {/* Zone centrale */}
        <main>
          <GameArea game={game} currentUserId={userId} users={users} />
        </main>
      </div>
      
      {/* Paramètres (admin seulement) */}
      {isAdmin && <GameSettings game={game} users={users} />}
    </div>
  );
}
```

---

### 📄 `src/components/GameHeader.tsx`

**Rôle** : Affiche les informations en haut de l'écran.

**Affichage** :
```
┌─────────────────────────────────────────────────┐
│  👥 3 joueurs connectés | 🎮 Partie en cours    │
│  ⚙️ Vous êtes l'administrateur                  │
└─────────────────────────────────────────────────┘
```

**Ce qu'il affiche** :
- Nombre de joueurs connectés
- Statut de la partie (En attente / En cours / Terminée)
- Badge admin si vous êtes admin

---

### 📄 `src/components/GameArea.tsx`

**Rôle** : Zone de jeu principale avec la bombe, le timer et l'input.

#### 3 états différents :

**1. En attente (waiting)** :
```
┌─────────────────────────┐
│  🎮 En attente...       │
│  Minimum 2 joueurs      │
│  [Rejoindre la partie]  │
└─────────────────────────┘
```

**2. En cours (playing)** :
```
┌─────────────────────────┐
│        ⏱️ 18s           │
│      💣 Bombe           │
│                         │
│  Syllabe: "RA"          │
│  🔥 À VOUS DE JOUER !   │
│                         │
│  [Tapez un mot...]      │
│  [Valider]              │
│                         │
│  Mots utilisés:         │
│  RADIS, RAYON, RAGE     │
└─────────────────────────┘
```

**3. Terminée (finished)** :
```
┌─────────────────────────┐
│  🏆 Partie terminée !   │
│                         │
│  Le gagnant est:        │
│      Alice              │
│                         │
│  [Nouvelle partie]      │
└─────────────────────────┘
```

**Code simplifié** :
```tsx
export default function GameArea({ game, currentUserId }) {
  const [word, setWord] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(0);

  const isMyTurn = game.bombState?.activePlayerId === currentUserId;

  // Timer qui décrémente chaque 100ms
  useEffect(() => {
    if (game.status !== "playing") return;
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 0.1));
    }, 100);
    
    return () => clearInterval(interval);
  }, [game.bombState.timeRemaining]);

  // Soumettre un mot
  const handleSubmit = () => {
    if (word.trim()) {
      socketManager.submitWord(word);
      setWord("");
    }
  };

  // Affichage selon l'état
  if (game.status === "waiting") {
    return <div>En attente...</div>;
  }

  if (game.status === "finished") {
    return <div>Partie terminée! Gagnant: {game.winnerId}</div>;
  }

  // En cours
  return (
    <div>
      <div className="timer">{Math.ceil(timeRemaining)}s</div>
      <div className="syllabe">{game.bombState.currentLetter}</div>
      
      {isMyTurn ? (
        <>
          <p>🔥 À VOUS DE JOUER !</p>
          <input 
            value={word}
            onChange={(e) => setWord(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <button onClick={handleSubmit}>Valider</button>
        </>
      ) : (
        <p>⏳ Attendez votre tour...</p>
      )}
    </div>
  );
}
```

---

### 📄 `src/components/UsersList.tsx`

**Rôle** : Affiche la liste des joueurs avec leurs vies.

**Affichage** :
```
┌─────────────────┐
│  👥 Joueurs (4) │
├─────────────────┤
│ 👤 Alice ❤️❤️❤️  │  ← En jeu, 3 vies
│ 🔥 Bob ❤️❤️      │  ← Son tour, 2 vies
│ 👤 Charlie ❤️    │  ← En jeu, 1 vie
│ 💀 Dave         │  ← Éliminé
└─────────────────┘
```

**Code simplifié** :
```tsx
export default function UsersList({ users, game, currentUserId }) {
  return (
    <div>
      <h3>👥 Joueurs ({users.length})</h3>
      
      {users.map(user => {
        const player = game.players.find(p => p.id === user.id);
        const isActive = game.bombState?.activePlayerId === user.id;
        const isMe = user.id === currentUserId;
        
        return (
          <div key={user.id} className={isActive ? "active" : ""}>
            {isActive && "🔥 "}
            {user.name}
            {isMe && " (Vous)"}
            {user.isAdmin && " 👑"}
            
            {player && (
              <div>
                {player.lives > 0 ? (
                  "❤️".repeat(player.lives)
                ) : (
                  "💀"
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

---

### 📄 `src/components/ChatArea.tsx`

**Rôle** : Zone de chat pour communiquer entre joueurs.

**Affichage** :
```
┌──────────────────────┐
│  💬 Chat             │
├──────────────────────┤
│ Alice: Salut!        │
│ Bob: Prêt?           │
│ ✅ Alice a trouvé:   │
│    "RADIS"           │
│ 💥 Bob a explosé!    │
│                      │
│ [Tapez un message]   │
│ [Envoyer]            │
└──────────────────────┘
```

**2 types de messages** :
- **Messages joueurs** : affichés normalement
- **Messages système** : événements du jeu (mot trouvé, explosion, etc.)

**Code simplifié** :
```tsx
export default function ChatArea({ messages, currentUserId }) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      socketManager.sendMessage(message);
      setMessage("");
    }
  };

  return (
    <div>
      <h3>💬 Chat</h3>
      
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className={msg.type}>
            {msg.type === "user" ? (
              <span>{msg.user.name}: {msg.content}</span>
            ) : (
              <span className="system">{msg.content}</span>
            )}
          </div>
        ))}
      </div>
      
      <div className="input">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>Envoyer</button>
      </div>
    </div>
  );
}
```

---

### 📄 `src/components/GameSettings.tsx`

**Rôle** : Panneau de configuration (visible uniquement par l'admin).

**Affichage** :
```
┌─────────────────────────────────────────┐
│  ⚙️ Paramètres de la partie             │
├─────────────────────────────────────────┤
│  ⏱️ Temps minimum: [15s] ━━━━○━━━       │
│  ⏱️ Temps maximum: [30s] ━━━━━━○━       │
│  ❤️ Vies de départ: [3]  ━━○━━━━       │
│                                         │
│  [Appliquer les changements]           │
│                                         │
│  Gestion des joueurs:                  │
│  • Alice 👑                             │
│  • Bob [Expulser]                       │
│  • Charlie [Expulser]                   │
└─────────────────────────────────────────┘
```

**Ce qu'on peut faire** :
- Régler le temps minimum (5-20s)
- Régler le temps maximum (15-60s)
- Régler le nombre de vies (1-5)
- Expulser des joueurs

**Code simplifié** :
```tsx
export default function GameSettings({ game, users }) {
  const [minTime, setMinTime] = useState(game.settings.minTime);
  const [maxTime, setMaxTime] = useState(game.settings.maxTime);
  const [lives, setLives] = useState(game.settings.startingLives);

  const handleUpdate = () => {
    socketManager.updateSettings({ minTime, maxTime, startingLives: lives });
  };

  const handleKick = (userId) => {
    if (confirm("Expulser ce joueur ?")) {
      socketManager.kickPlayer(userId);
    }
  };

  return (
    <div>
      <h3>⚙️ Paramètres</h3>
      
      {/* Sliders */}
      <div>
        <label>⏱️ Temps minimum: {minTime}s</label>
        <input 
          type="range" 
          min="5" 
          max="20" 
          value={minTime}
          onChange={(e) => setMinTime(Number(e.target.value))}
          disabled={game.status === "playing"}
        />
      </div>
      
      <div>
        <label>⏱️ Temps maximum: {maxTime}s</label>
        <input 
          type="range" 
          min="15" 
          max="60" 
          value={maxTime}
          onChange={(e) => setMaxTime(Number(e.target.value))}
          disabled={game.status === "playing"}
        />
      </div>
      
      <div>
        <label>❤️ Vies: {lives}</label>
        <input 
          type="range" 
          min="1" 
          max="5" 
          value={lives}
          onChange={(e) => setLives(Number(e.target.value))}
          disabled={game.status === "playing"}
        />
      </div>
      
      <button onClick={handleUpdate}>Appliquer</button>
      
      {/* Gestion joueurs */}
      <div>
        <h4>Gestion des joueurs</h4>
        {users.map(user => (
          <div key={user.id}>
            {user.name} {user.isAdmin && "👑"}
            {!user.isAdmin && (
              <button onClick={() => handleKick(user.id)}>Expulser</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🔧 UTILITAIRES

### 📄 `src/lib/socket.ts`

**Rôle** : Gère toutes les communications avec le serveur.

**Pourquoi ?** Au lieu d'appeler directement `socket.emit()` partout, on a des méthodes claires.

**Méthodes disponibles** :
```typescript
// Connexion
socketManager.connect(url)
socketManager.disconnect()

// Utilisateur
socketManager.setName(name)

// Partie
socketManager.joinGame()
socketManager.leaveGame()
socketManager.startGame()
socketManager.submitWord(word)

// Admin
socketManager.kickPlayer(userId)
socketManager.updateSettings(settings)

// Chat
socketManager.sendMessage(message)

// Écouter les événements
socketManager.on("event-name", callback)
socketManager.off("event-name")
```

**Exemple d'utilisation** :
```typescript
// ❌ Sans wrapper (compliqué)
socket.emit("game:submit-word", "radis");

// ✅ Avec wrapper (clair)
socketManager.submitWord("radis");
```

---

### 📄 `src/lib/types.ts`

**Rôle** : Définit tous les types TypeScript du projet.

**Pourquoi ?** TypeScript nous aide à éviter les erreurs en définissant la structure des données.

**Principaux types** :

```typescript
// Utilisateur
interface User {
  id: string;
  name: string;
  isAdmin: boolean;
}

// Joueur (utilisateur + état dans le jeu)
interface Player extends User {
  lives: number;
  isActive: boolean;
}

// Paramètres
interface GameSettings {
  minTime: number;
  maxTime: number;
  startingLives: number;
}

// État de la bombe
interface BombState {
  activePlayerId: string;      // À qui c'est le tour
  currentLetter: string;        // Syllabe actuelle
  timeRemaining: number;        // Temps restant
  usedWords: string[];          // Mots déjà utilisés
  roundNumber: number;          // Numéro du tour
  lastWordLength?: number;      // Longueur du dernier mot
  timeWhenWordSubmitted?: number; // Temps utilisé dernier tour
}

// Partie
interface Game {
  status: "waiting" | "playing" | "finished";
  players: Player[];
  settings: GameSettings;
  bombState: BombState;
  winnerId?: string;
}

// Message
interface Message {
  id: string;
  content: string;
  user: User;
  timestamp: number;
  type: "user" | "system";
}
```

---

### 📄 `src/lib/utils.ts`

**Rôle** : Fonctions utilitaires réutilisables.

**Fonctions disponibles** :
```typescript
// Classe CSS conditionnelle
cn("class1", condition && "class2", "class3")

// Formater un timestamp
formatTime(timestamp) // "14:32"

// Calculer pourcentage
calculatePercentage(value, max) // 75
```

---

## 🔄 Flux de Données Simplifié

### 1. Connexion
```
Utilisateur → LoginForm → socket.setName("Alice")
    ↓
Serveur reçoit et valide
    ↓
Serveur → Tous les clients : "users:list"
    ↓
Tous les clients mettent à jour leur liste
```

### 2. Démarrer partie
```
Admin → GameSettings → socket.startGame()
    ↓
Serveur initialise la partie
    ↓
Serveur → Tous : "game:state" (status: "playing")
    ↓
Tous affichent GameArea en mode jeu
```

### 3. Soumettre un mot
```
Joueur → GameArea → socket.submitWord("radis")
    ↓
Serveur valide le mot
    ↓
Si valide:
  - Ajoute à usedWords
  - Calcule nouveau temps
  - Passe au joueur suivant
  - Serveur → Tous : "game:state" (nouveau tour)
    ↓
Si invalide:
  - Serveur → Joueur : "game:word-rejected" (raison)
```

### 4. Explosion
```
Timer atteint 0
    ↓
Serveur détecte
    ↓
Serveur retire une vie au joueur actif
    ↓
Si lives > 0: passe au suivant
Si lives = 0: élimine et vérifie fin de partie
    ↓
Serveur → Tous : "game:state" (nouveau tour ou fin)
```

---

## 📝 Récapitulatif des Responsabilités

### SERVEUR (`socket-server.js`)
- ✅ Gère les connexions
- ✅ Valide les mots
- ✅ Calcule le temps dynamique
- ✅ Gère le timer de la bombe
- ✅ Détermine le gagnant
- ✅ Source de vérité (état unique)

### CLIENT (`page.tsx`)
- ✅ Se connecte au serveur
- ✅ Écoute les événements
- ✅ Affiche le bon composant (LoginForm ou GameRoom)

### COMPOSANTS
- **LoginForm** : Connexion initiale
- **GameRoom** : Organisation générale
- **GameHeader** : Infos en haut
- **GameArea** : Jeu principal (bombe, timer, input)
- **UsersList** : Liste joueurs + vies
- **ChatArea** : Communication
- **GameSettings** : Configuration admin

### UTILITAIRES
- **socket.ts** : Wrapper Socket.IO
- **types.ts** : Définitions TypeScript
- **utils.ts** : Fonctions réutilisables

---

## 🎯 Points Clés à Retenir

1. **Séparation claire** : Serveur (logique) / Client (affichage)
2. **Composants modulaires** : Chaque composant a une responsabilité unique
3. **Communication temps réel** : Socket.IO pour échanges instantanés
4. **État global côté serveur** : Une seule source de vérité
5. **TypeScript** : Évite les erreurs avec typage strict
6. **Validation stricte** : Serveur vérifie tout (pas de triche possible)

---

## 🚀 Pour Démarrer

```bash
# Terminal 1 : Serveur
cd server
npm install
node socket-server.js

# Terminal 2 : Client
npm install
npm run dev
```

Ouvrez plusieurs onglets sur `http://localhost:3000` pour tester le multijoueur !

---

*Guide créé pour comprendre rapidement l'architecture de BoomParty* 🎮
