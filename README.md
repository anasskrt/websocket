# 💣 BoomParty - Tic Tac Boom Game

Application de jeu multijoueur en temps réel basée sur le célèbre jeu "Tic Tac Boom". Les joueurs doivent trouver des mots contenant une syllabe donnée avant que la bombe n'explose !

## 📋 Table des matières
- [Technologies utilisées](#technologies-utilisées)
- [Architecture du projet](#architecture-du-projet)
- [Installation](#installation)
- [Fonctionnement détaillé](#fonctionnement-détaillé)
- [Structure des fichiers](#structure-des-fichiers)

---

## 🛠 Technologies utilisées

### Frontend
- **Next.js 15** - Framework React pour le rendu côté serveur
- **React 19** - Bibliothèque UI
- **TypeScript** - Typage statique
- **Tailwind CSS 4** - Framework CSS utilitaire
- **Socket.IO Client** - Communication temps réel avec le serveur

### Backend
- **Node.js** - Environnement d'exécution JavaScript
- **Socket.IO** - Communication bidirectionnelle en temps réel
- **Express** - Serveur HTTP (via Socket.IO)

### Outils et bibliothèques
- **UUID** - Génération d'identifiants uniques
- **an-array-of-french-words** - Dictionnaire de mots français pour validation
- **Iconify API** - Icônes SVG depuis CDN

---

## 🏗 Architecture du projet

```
boomparty/
├── server/
│   └── socket-server.js          # Serveur Socket.IO (backend)
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Layout principal Next.js
│   │   ├── page.tsx               # Page d'accueil
│   │   └── globals.css            # Styles globaux
│   ├── components/
│   │   ├── ChatArea.tsx           # Interface de chat
│   │   ├── GameArea.tsx           # Zone de jeu principale
│   │   ├── GameHeader.tsx         # En-tête avec infos utilisateur
│   │   ├── GameRoom.tsx           # Composant principal du salon
│   │   ├── GameSettings.tsx       # Paramètres de jeu (admin)
│   │   ├── LoginForm.tsx          # Formulaire de connexion
│   │   └── UsersList.tsx          # Liste des joueurs connectés
│   └── lib/
│       ├── socket.ts              # Gestionnaire Socket.IO client
│       ├── types.ts               # Types TypeScript
│       └── utils.ts               # Fonctions utilitaires
├── public/
│   └── avatars/                   # Images d'avatars
├── package.json                   # Dépendances et scripts
└── README.md                      # Ce fichier
```

---

## 📦 Installation

### Prérequis
- Node.js 20+ 
- npm ou yarn

### Étapes

1. **Cloner le projet**
```bash
git clone <votre-repo>
cd boomparty
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Lancer l'application complète**
```bash
npm run dev:full
```

Cette commande lance **simultanément** :
- Le serveur Next.js sur `http://localhost:3000` (ou 3002)
- Le serveur Socket.IO sur `http://localhost:3001`

### Commandes disponibles

```bash
npm run dev           # Lance uniquement Next.js
npm run socket-server # Lance uniquement le serveur Socket.IO
npm run dev:full      # Lance les deux en parallèle
npm run build         # Construit l'application pour la production
npm run start         # Lance l'application en production
```

---

## 🎮 Fonctionnement détaillé

### 1. Serveur Socket.IO (`server/socket-server.js`)

Le serveur gère toute la logique backend du jeu.

#### État global du jeu (`gameState`)

```javascript
const gameState = {
  users: new Map(),        // Map<socketId, User>
  messages: [],            // Historique des messages
  game: {
    isActive: false,       // Le jeu est-il en cours ?
    status: "waiting",     // "waiting" | "playing" | "finished"
    players: [],           // Liste des joueurs avec leurs vies
    bombState: {
      currentLetter: "",   // Syllabe actuelle
      timeRemaining: 0,    // Temps restant (secondes)
      maxTime: 0,          // Temps maximum du tour
      activePlayerId: null,// ID du joueur actif
      usedWords: [],       // Mots déjà utilisés
      roundNumber: 0       // Numéro du tour
    },
    winner: null,          // Gagnant de la partie
    settings: {
      minTime: 10,         // Temps minimum (secondes)
      maxTime: 30,         // Temps maximum (secondes)
      startingLives: 3     // Nombre de vies de départ
    }
  },
  bombTimer: null          // Intervalle du timer
};
```

#### Fonctions principales

**Gestion des utilisateurs**

- `createUser(userData, socketId, isFirstUser)` : Crée un nouvel utilisateur avec un ID unique. Le premier utilisateur devient automatiquement admin.

- `assignAdminToOldestUser()` : Transfère les droits admin à l'utilisateur le plus ancien si l'admin se déconnecte.

- `broadcastUsersList()` : Envoie la liste complète des utilisateurs à tous les clients connectés.

**Gestion des messages**

- `createMessage(content, sender, type, recipient)` : Crée un objet message avec timestamp et informations du sender.

- `validateMessage(content)` : Vérifie que le message est valide (non vide, < 500 caractères).

**Logique du jeu**

- `COMBINAISONS` : Array de 180+ syllabes de 2-3 lettres utilisées dans le jeu.

- `getValidatedCombinations()` : Filtre les syllabes ayant au moins 10 mots possibles dans le dictionnaire. Cache le résultat pour performance.

- `getRandomSyllabe()` : Retourne une syllabe aléatoire parmi les validées.

- `getRandomTime(min, max)` : Génère un temps aléatoire entre min et max secondes.

- `checkWordExists(word)` : Vérifie si un mot existe dans le dictionnaire français (Set de 300k+ mots).

- `validateWord(word, syllabe, usedWords)` : Validation complète d'un mot soumis :
  1. Minimum 4 lettres
  2. Contient la syllabe requise
  3. Pas déjà utilisé
  4. Existe dans le dictionnaire

**Cycle de jeu**

- `initializeGame()` : Initialise une nouvelle partie :
  - Reset les vies de tous les joueurs
  - Génère la première syllabe
  - Définit le temps aléatoire
  - Désigne le premier joueur
  - Lance le timer

- `startBombTimer()` : Lance un intervalle qui décrémente le temps chaque seconde et émet `game:bomb-tick` à tous les clients.

- `handleExplosion()` : Appelée quand le timer atteint 0 :
  - Retire une vie au joueur actif
  - Vérifie si le joueur est éliminé
  - Vérifie si la partie est terminée (≤1 joueur vivant)
  - Passe au joueur suivant

- `nextPlayer()` : Passe au joueur vivant suivant dans l'ordre circulaire :
  - Génère nouvelle syllabe
  - Calcule le temps selon la logique dynamique (voir ci-dessous)
  - Incrémente le numéro de tour
  - Relance le timer

- `calculateBombTime(roundNumber, settings, lastWordLength, lastTimeUsed)` : **Nouvelle logique de temps dynamique** 🎯
  - **Diminution progressive** : Le temps diminue de 1.5s à chaque tour
  - **Bonus mots longs** : 
    - 8+ lettres = +3 secondes pour le suivant
    - 6-7 lettres = +2 secondes
    - 4 lettres = -2 secondes
  - **Malus vitesse** : Si répondu en moins de 30% du temps = -3 secondes pour le suivant
  - Garantit toujours un temps entre `minTime` et `maxTime`

- `endGame(winner)` : Termine la partie et annonce le gagnant.

- `stopGame()` : Arrête manuellement la partie (action admin).

- `broadcastGameState()` : Synchronise l'état du jeu avec tous les clients.

#### Événements Socket.IO

**Connexion et chat**

- `connection` : Nouvelle connexion cliente établie

- `user:join` : Utilisateur tente de se connecter
  - Validation du nom (3-20 caractères, unique)
  - Création de l'utilisateur
  - Envoi de l'historique des messages
  - Broadcast aux autres utilisateurs

- `message:global` : Envoi d'un message global
  - Validation du contenu
  - Diffusion à tous les utilisateurs

- `message:private` : Envoi d'un message privé
  - Validation du destinataire
  - Envoi uniquement au sender et recipient

- `admin:kick` : Admin expulse un utilisateur
  - Vérification des droits admin
  - Déconnexion forcée de l'utilisateur

**Événements de jeu**

- `game:start` : Démarre une partie
  - Vérifie que l'admin lance
  - Vérifie minimum 2 joueurs
  - Appelle `initializeGame()`

- `game:stop` : Arrête la partie
  - Réservé à l'admin
  - Appelle `stopGame()`

- `game:update-settings` : Modifie les paramètres
  - Réservé à l'admin
  - Impossible pendant une partie
  - Validation des valeurs (temps 5-60s, vies 1-10)

- `game:submit-word` : Soumission d'un mot
  - Vérifie que c'est le tour du joueur
  - Valide le mot avec `validateWord()`
  - Si invalide : envoie `game:word-rejected`
  - Si valide : ajoute aux mots utilisés et passe au suivant

- `disconnect` : Déconnexion d'un utilisateur
  - Suppression de la Map users
  - Réassignation admin si nécessaire
  - Broadcast de la déconnexion

---

### 2. Client Socket.IO (`src/lib/socket.ts`)

Classe `SocketManager` qui encapsule toutes les interactions avec le serveur.

#### Méthodes de connexion

- `connect()` : Établit la connexion au serveur sur `localhost:3001`
- `disconnect()` : Ferme la connexion proprement
- `joinGame(userData)` : Envoie les infos de connexion (nom, avatar)

#### Méthodes d'émission

- `sendGlobalMessage(content)` : Envoie un message global
- `sendPrivateMessage(content, recipientId)` : Envoie un message privé
- `kickUser(userId)` : Expulse un utilisateur (admin)
- `startGame()` : Démarre une partie (admin)
- `stopGame()` : Arrête une partie (admin)
- `submitWord(word)` : Soumet un mot pendant la partie
- `updateGameSettings(settings)` : Modifie les paramètres (admin)

#### Méthodes d'écoute

- `onUserJoined(callback)` : Écoute les nouvelles connexions
- `onUsersListUpdate(callback)` : Écoute les mises à jour de la liste
- `onMessageReceived(callback)` : Écoute les nouveaux messages
- `onGameUpdated(callback)` : Écoute les changements d'état du jeu
- `onBombTick(callback)` : Écoute le décompte de la bombe
- `onExplosion(callback)` : Écoute les explosions
- `onWordRejected(callback)` : Écoute les rejets de mots
- `onError(callback)` : Écoute les erreurs

---

### 3. Types TypeScript (`src/lib/types.ts`)

Définit toutes les interfaces du projet pour un typage strict.

```typescript
export interface User {
  id: string;
  name: string;
  avatar: string;
  isAdmin: boolean;
  connectedAt: Date;
  lastActivity: Date;
  socketId: string;
  lives?: number;
  isAlive?: boolean;
}

export interface Message {
  id: string;
  type: "global" | "private" | "system";
  content: string;
  sender: User;
  recipient: User | null;
  timestamp: Date;
}

export interface BombState {
  currentLetter: string;
  timeRemaining: number;
  maxTime: number;
  activePlayerId: string | null;
  usedWords: string[];
  roundNumber: number;
}

export interface BoomPartyGame {
  isActive: boolean;
  status: "waiting" | "playing" | "finished";
  players: User[];
  bombState: BombState;
  winner: User | null;
  settings: {
    minTime: number;
    maxTime: number;
    startingLives: number;
  };
}
```

---

### 4. Composants React

#### `LoginForm.tsx`
- Formulaire de connexion initial
- Sélection du nom et de l'avatar
- Validation côté client avant envoi

#### `GameRoom.tsx`
- Composant conteneur principal
- Gère tous les états React
- Établit la connexion Socket.IO
- Distribue les données aux composants enfants

#### `GameHeader.tsx`
- Affiche les informations de l'utilisateur connecté
- Nombre de joueurs en ligne
- Badge admin
- Bouton de déconnexion

#### `UsersList.tsx`
- Liste tous les joueurs connectés
- Affiche les vies et statut (vivant/éliminé)
- Bouton d'expulsion pour l'admin

#### `GameSettings.tsx`
- Panneau de configuration (admin uniquement)
- Sliders pour temps min/max et vies
- Désactivé pendant une partie

#### `ChatArea.tsx`
- Zone de chat en temps réel
- Messages globaux, privés et système
- Scroll automatique vers le bas
- Formulaire d'envoi de message

#### `GameArea.tsx`
- Zone de jeu principale avec 3 états :
  
  **État "waiting"**
  - Affiche les règles
  - Bouton "Démarrer" pour l'admin
  
  **État "playing"**
  - Bombe animée avec timer
  - Syllabe courante à trouver
  - Indicateur du joueur actif
  - Input pour soumettre un mot
  - Liste des mots déjà utilisés
  - Animation de shake quand temps < 5s
  
  **État "finished"**
  - Annonce du gagnant
  - Classement final
  - Bouton "Nouvelle partie" pour l'admin

---

### 5. Utilitaires (`src/lib/utils.ts`)

```typescript
// Combine des classes Tailwind intelligemment
export function cn(...inputs: ClassValue[]): string

// Formate une date en HH:MM
export function formatTime(date: Date | string): string

// Génère l'URL d'un avatar depuis le dossier public
export function getAvatarUrl(avatarName: string): string
```

---

## 🎨 Personnalisation

### Modifier les syllabes

Éditez le tableau `COMBINAISONS` dans `server/socket-server.js` :

```javascript
const COMBINAISONS = [
  "AB", "AC", "AD", ...
];
```

### Ajouter des avatars

1. Placez les images dans `public/avatars/`
2. Nommez-les par exemple : `boy-1.png`, `girl-2.png`
3. Utilisez-les dans le formulaire de connexion

### Modifier les paramètres par défaut

Dans `server/socket-server.js` :

```javascript
settings: {
  minTime: 10,         // Temps minimum
  maxTime: 30,         // Temps maximum
  startingLives: 3     // Vies de départ
}
```

### Personnaliser les styles

Tailwind CSS est utilisé. Modifiez `src/app/globals.css` pour les styles globaux ou directement les classes dans les composants.

---

## 🔒 Sécurité

- Validation côté serveur de tous les inputs
- Limitation de taille des messages (500 caractères)
- Vérification des permissions admin
- CORS configuré pour localhost uniquement
- Pas de stockage de données sensibles

---

## 🚀 Déploiement

### Développement local
```bash
npm run dev:full
```

### Production

1. **Build Next.js**
```bash
npm run build
```

2. **Lancer les deux serveurs**
```bash
npm start &
npm run socket-server
```

### Hébergement recommandé

- **Frontend (Next.js)** : Vercel, Netlify, AWS Amplify
- **Backend (Socket.IO)** : Railway, Render, Heroku, DigitalOcean

**Important** : Configurez les variables d'environnement pour les URLs de production !

---

## 🐛 Dépannage

### Erreur CORS
```
Access-Control-Allow-Origin header has a value that is not equal to the supplied origin
```
**Solution** : Vérifiez que le port de votre app Next.js correspond à celui configuré dans `server/socket-server.js` (ligne 10).

### Socket.IO ne se connecte pas
```
GET /socket.io/?EIO=4&transport=polling 404
```
**Solution** : Vérifiez que le serveur Socket.IO est bien lancé sur le port 3001.

### Mots non validés
Si des mots français valides sont rejetés, c'est que le dictionnaire ne les contient pas. Vous pouvez ajouter des mots manuellement au Set `frenchWordsSet`.

---

## 📝 License

Ce projet est sous licence MIT. Libre d'utilisation, modification et distribution.

---

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Ouvrir une issue pour signaler un bug
- Proposer de nouvelles fonctionnalités
- Soumettre des pull requests

---

## 📧 Contact

Pour toute question : [votre-email]

---

**Amusez-vous bien ! 💣🎉**
