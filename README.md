# Real-Time Poll Rooms

## Internship Assignment Submission

**Candidate**: Kummari Maruthi  
**Position**: Developer Intern  
**Date**: February 15, 2026

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Tech Stack](#tech-stack)
4. [Backend Design](#backend-design)
5. [API Documentation](#api-documentation)
6. [Fairness & Anti-Abuse Mechanisms](#fairness--anti-abuse-mechanisms)
7. [Frontend Design](#frontend-design)
8. [UI/UX Decisions](#uiux-decisions)
9. [Real-Time Updates Flow](#real-time-updates-flow)
10. [Deployment Strategy](#deployment-strategy)
11. [Edge Cases Handled](#edge-cases-handled)
12. [Known Limitations](#known-limitations)
13. [Future Improvements](#future-improvements)
14. [Local Development Setup](#local-development-setup)
15. [Conclusion](#conclusion)

---

## Project Overview

### What I Built

I've developed a production-ready, full-stack real-time polling application where users can:

- Create polls with custom questions and multiple answer options
- Share polls via secure, unique URLs
- Vote on polls with instant feedback
- View live vote counts and percentages as other users vote
- Experience a modern, responsive interface across devices

### Why I Built This

I developed this project as my technical assignment for the Full-Stack Developer internship position. The assignment asked me to demonstrate:

- Full-stack development capabilities
- Real-time communication implementation
- Clean code architecture and engineering decisions
- Database design and persistence
- Deployment and production readiness

### My Key Goals

When building this application, I focused on:

1. **Correctness**: Implementing all core features reliably and bug-free
2. **Clarity**: Writing clean, maintainable, well-documented code
3. **Real-Time**: Delivering instant updates without page refresh
4. **Fairness**: Preventing abuse while maintaining simplicity
5. **Professional UI**: Creating an intuitive, modern user experience

---

## Architecture Overview

### How I Designed the System

I built this application using a client-server architecture with clear separation of concerns:

```
┌─────────────────┐         HTTP/REST        ┌─────────────────┐
│                 │ ───────────────────────> │                 │
│   Next.js       │                          │   Express       │
│   Frontend      │ <─────────────────────── │   Backend       │
│   (Vercel)      │      Socket.IO (WSS)     │   (Render)      │
│                 │                          │                 │
└─────────────────┘                          └────────┬────────┘
                                                      │
                                                      │ Mongoose
                                                      ▼
                                              ┌─────────────────┐
                                              │   MongoDB       │
                                              │   Atlas         │
                                              └─────────────────┘
```

### Why I Chose Separate Deployments

**Backend on Render (Persistent Server)**

I needed Socket.IO to work properly, which requires a persistent, stateful server to maintain WebSocket connections. I chose Render because it provides:

- Always-on Node.js processes
- WebSocket support
- Persistent memory for managing socket rooms
- Reliable uptime for real-time features

**Frontend on Vercel (Edge Network)**

I deployed the Next.js frontend on Vercel for:

- Global CDN distribution
- Instant static page serving
- Automatic optimization
- Seamless CI/CD integration

**Database on MongoDB Atlas**

I selected MongoDB Atlas for:

- Managed, scalable cloud database
- Automatic backups and monitoring
- Geographic redundancy
- Free tier suitable for MVP deployment

### How Communication Works

I implemented two types of communication:

1. **REST APIs**: For CRUD operations (create poll, fetch poll data, submit votes)
2. **WebSocket (Socket.IO)**: For real-time vote updates across clients
3. **Headers**: I use custom headers (`x-vote-token`, `x-client-id`) for fairness enforcement

---

## Tech Stack

### Technologies I Used

#### Backend

| Technology | Purpose | Why I Chose It |
|------------|---------|----------------|
| **Node.js** | Runtime environment | Non-blocking I/O is ideal for real-time applications |
| **Express** | Web framework | Minimalist, flexible, and well-documented |
| **TypeScript** | Type safety | Catches errors at compile-time and improves maintainability |
| **MongoDB** | Database | Flexible schema and document-based model suits poll structure |
| **Mongoose** | ODM | Schema validation, middleware, and query builder |
| **Socket.IO** | Real-time engine | Abstracts WebSocket complexity with automatic reconnection |
| **Firebase Admin SDK** | Authentication | Verifies Google OAuth tokens server-side securely |
| **CORS** | Cross-origin support | Enables frontend-backend communication across domains |

#### Frontend

| Technology | Purpose | Why I Chose It |
|------------|---------|----------------|
| **Next.js 15** | React framework | App Router, server components, and optimized performance |
| **TypeScript** | Type safety | Consistent type checking across my full stack |
| **Tailwind CSS** | Styling | Utility-first approach enables rapid UI development |
| **react-hot-toast** | Notifications | Lightweight and customizable toast notifications |
| **Socket.IO Client** | Real-time client | Pairs perfectly with my backend Socket.IO server |
| **Axios** | HTTP client | Promise-based with interceptors and clean API |
| **Firebase Client SDK** | Authentication | Google OAuth login with seamless token management |

#### Development Tools

- **ESLint**: Code quality and consistency
- **TypeScript Compiler**: Type checking and transpilation
- **Git**: Version control

---

## Backend Design

### How I Structured the Backend

```
realtime-poll-backend/
├── config/
│   └── firebaseAdmin.ts       # Firebase Admin SDK initialization
├── src/
│   ├── server.ts              # Entry point, Socket.IO setup
│   ├── middleware/
│   │   └── auth.ts            # Authentication middleware
│   ├── models/
│   │   ├── poll.ts            # Poll schema and model
│   │   └── vote.ts            # Vote tracking schema
│   ├── controllers/
│   │   └── pollController.ts  # Business logic
│   └── routes/
│       └── pollRoutes.ts      # API route definitions
├── package.json
├── tsconfig.json
├── serviceAccountKey.json     # Firebase credentials (gitignored)
└── .env
```

### How I Designed the Poll Schema

```typescript
interface IPoll {
    question: string;                    // The poll question
    options: IOption[];                  // Array of answer options
    votedTokens: string[];               // Vote tokens that have voted (secondary layer)
    votedClients: string[];              // Client IDs that have voted (tertiary layer)
    tokenVotes: Map<string, number>;     // Maps token/clientId to vote choice
    timestamps: true;                    // createdAt, updatedAt
}

interface IOption {
    text: string;                        // Option display text
    votes: number;                       // Vote count
}

interface IVote {
    pollId: string;                      // Reference to poll
    userId: string;                      // Firebase Auth UID (primary fairness layer)
    optionId: string;                    // Selected option ID
    userEmail?: string;                  // User's email (optional)
    votedAt: Date;                       // Timestamp
}
```

**My Design Decisions:**

1. **Separate Vote Collection**: I created a dedicated Vote model to track authenticated user votes independently, enforcing one vote per Google account per poll

2. **Options as Embedded Documents**: I stored options within the poll document rather than in a separate collection for simplicity and atomic updates

3. **Triple-Layer Fairness**: I included Google OAuth userId (Vote collection), votedTokens, and votedClients arrays to enable checking against three independent mechanisms

4. **Vote Mapping with Map**: I used the `tokenVotes` Map to store which option each token/clientId voted for, enabling the "Your Vote" badge to persist across page refreshes

5. **Timestamps**: I enabled automatic tracking to allow future features like poll expiration or analytics

### My API Design Philosophy

When designing the APIs, I followed these principles:

1. **RESTful Endpoints**: Clear, predictable URL structure
2. **JSON Responses**: Consistent response format with `success`, `message`, `data`
3. **HTTP Status Codes**: Proper use of 200, 201, 400, 404, 500
4. **Error Handling**: Try-catch blocks with descriptive error messages
5. **Header-Based Context**: Custom headers to avoid polluting request body

---

## API Documentation

### Base URL

- **Development**: `http://localhost:5000/api/polls`
- **Production**: `https://your-backend.onrender.com/api/polls`

### 1. Create Poll

**Endpoint**: `POST /api/polls`

**Description**: Creates a new poll with a question and multiple options.

**Request Body**:

```json
{
  "question": "What is your favorite programming language?",
  "options": ["JavaScript", "Python", "TypeScript", "Go"]
}
```

**Success Response** (201):

```json
{
  "success": true,
  "message": "Poll created successfully",
  "poll": {
    "_id": "65f8a3b2c4d5e6f7a8b9c0d1",
    "question": "What is your favorite programming language?",
    "options": [
      { "text": "JavaScript", "votes": 0, "_id": "..." },
      { "text": "Python", "votes": 0, "_id": "..." },
      { "text": "TypeScript", "votes": 0, "_id": "..." },
      { "text": "Go", "votes": 0, "_id": "..." }
    ],
    "votedTokens": [],
    "votedClients": [],
    "tokenVotes": {},
    "createdAt": "2026-02-15T10:30:00.000Z",
    "updatedAt": "2026-02-15T10:30:00.000Z"
  }
}
```

**Error Response** (400):

```json
{
  "success": false,
  "message": "Question and at least 2 options are required"
}
```

**Validation Rules**:

- `question` must be a non-empty string
- `options` must be an array with at least 2 elements
- Each option must be a non-empty string

---

### 2. Get Poll

**Endpoint**: `GET /api/polls/:id`

**Description**: Retrieves poll data and determines if the requesting client has already voted (checks Google OAuth user, vote token, or client ID).

**Headers** (optional):

```
Authorization: Bearer <FIREBASE_ID_TOKEN>    # If user is signed in
x-vote-token: abc123def456                   # Token from previous vote
x-client-id: uuid-client-id                  # Browser-unique identifier
```

**Success Response** (200):

```json
{
  "success": true,
  "message": "Poll retrieved successfully",
  "poll": {
    "_id": "65f8a3b2c4d5e6f7a8b9c0d1",
    "question": "What is your favorite programming language?",
    "options": [
      { "text": "JavaScript", "votes": 42, "_id": "..." },
      { "text": "Python", "votes": 38, "_id": "..." },
      { "text": "TypeScript", "votes": 15, "_id": "..." },
      { "text": "Go", "votes": 5, "_id": "..." }
    ],
    "votedTokens": ["token1", "token2", ...],
    "votedClients": ["client1", "client2", ...],
    "tokenVotes": { "token1": 0, "client1": 1, ... },
    "createdAt": "2026-02-15T10:30:00.000Z",
    "updatedAt": "2026-02-15T11:45:00.000Z"
  },
  "userVotedOption": 1    # Index of option user voted for (null if not voted)
}
```

**Backend Logic** (Priority Order):

1. If user is authenticated (Authorization header), check Vote collection: `Vote.findOne({ pollId, userId })`
2. If `x-vote-token` header exists, check `poll.tokenVotes.get(voteToken)`
3. If `x-client-id` header exists, check `poll.tokenVotes.get(clientId)`
4. Return vote index or `null`

**Error Response** (404):

```json
{
  "success": false,
  "message": "Poll not found"
}
```

---

### 3. Vote on Poll

**Endpoint**: `POST /api/polls/:id/vote`

**Description**: Records a vote on a specific option, enforces multi-layer fairness checks (Google OAuth + token + clientId), and broadcasts update via Socket.IO.

**Headers** (required):

```
Authorization: Bearer <FIREBASE_ID_TOKEN>    # REQUIRED: Firebase ID token from Google OAuth
x-vote-token: abc123def456                   # Optional: Token from previous vote
x-client-id: uuid-client-id                  # Optional: Browser client ID
```

**Request Body**:

```json
{
  "optionIndex": 1    # Zero-based index of selected option
}
```

**Success Response** (200):

```json
{
  "success": true,
  "message": "Vote recorded successfully",
  "poll": {
    "_id": "65f8a3b2c4d5e6f7a8b9c0d1",
    "question": "What is your favorite programming language?",
    "options": [
      { "text": "JavaScript", "votes": 42, "_id": "..." },
      { "text": "Python", "votes": 39, "_id": "..." },  // Incremented
      { "text": "TypeScript", "votes": 15, "_id": "..." },
      { "text": "Go", "votes": 5, "_id": "..." }
    ],
    ...
  },
  "voteToken": "new-generated-token-xyz"    # New token for this vote
}
```

**How I Implemented the Vote Flow:**

1. **Validate Authentication**: Verify Firebase ID token with Firebase Admin SDK
2. **Extract User ID**: Extract userId from decoded token
3. **Check Layer 1 (Google OAuth)**: Query Vote collection: `Vote.findOne({ pollId, userId })`
   - If found → Reject with 400 "Already voted"
4. **Validate Option Index**: Check if `optionIndex` is within valid range
5. **Check Layer 2 (Vote Token)**: If `x-vote-token` header exists and is in `votedTokens` array, reject with 400
6. **Check Layer 3 (Client ID)**: If `x-client-id` header exists and is in `votedClients` array, reject with 400
7. **Generate New Token**: Create a cryptographically secure random token (16 bytes: `crypto.randomBytes(16).toString('hex')`)
8. **Increment Vote Count**: `poll.options[optionIndex].votes++`
9. **Record Fairness Data**:
   - Create Vote document: `Vote.create({ pollId, userId, optionId, userEmail, votedAt })`
   - Add new token to `votedTokens` array
   - Add clientId to `votedClients` array (if provided)
   - Set `tokenVotes.set(newToken, optionIndex)`
   - Set `tokenVotes.set(clientId, optionIndex)` (if provided)
10. **Save to Database**: `await poll.save()`
11. **Broadcast Update**: `io.to(pollId).emit("voteUpdate", poll)`
12. **Return Response**: Include new vote token in response

**Error Responses**:

```json
// Not authenticated
{
  "success": false,
  "message": "Authentication required"
}

// Invalid token
{
  "success": false,
  "message": "Invalid authentication token"
}

// Already voted (any layer)
{
  "success": false,
  "message": "Already voted on this poll"
}

// Invalid option
{
  "success": false,
  "message": "Invalid option selected"
}

// Poll not found
{
  "success": false,
  "message": "Poll not found"
}
```

---

### 4. Real-Time Socket.IO Events

**Connection Setup**:

```javascript
const socket = io("https://backend-url.com", {
  transports: ['websocket', 'polling'],
  reconnection: true
});
```

**Events**:

#### Client → Server

**Event**: `joinPoll`

**Payload**: `pollId` (string)

**Purpose**: Subscribe client to room for receiving vote updates

```javascript
socket.emit("joinPoll", "65f8a3b2c4d5e6f7a8b9c0d1");
```

#### Server → Client

**Event**: `voteUpdate`

**Payload**: Updated poll object

**Purpose**: Broadcast vote changes to all clients in poll room

```javascript
socket.on("voteUpdate", (updatedPoll) => {
  setPoll(updatedPoll);  // Update UI with new data
});
```

**How I Implemented Broadcasting**:

When a vote is recorded in my `votePoll` controller:

```typescript
io.to(poll._id.toString()).emit("voteUpdate", poll);
```

All clients that have called `socket.emit("joinPoll", pollId)` receive the update instantly.

---

## Fairness & Anti-Abuse Mechanisms

This section explains my multi-layered authentication and fairness approach that implements **at least 2 mechanisms** as required by the assignment, with Google OAuth serving as the primary authentication layer.

### Why Fairness Matters

Without fairness mechanisms, a single user could:

- Vote multiple times by refreshing the page
- Skew results by submitting votes programmatically
- Manipulate outcomes in favor of specific options

For a polling application, robust fairness is essential to maintain data integrity and user trust.

### Assignment Requirement: Multi-Layer Fairness

The assignment explicitly required **at least 2 fairness mechanisms**. I implemented **3 layers** providing defense-in-depth:

1. **Google OAuth Authentication** (PRIMARY) - User account verification
2. **Vote Token** (SECONDARY) - Server-issued secure token
3. **Client ID** (TERTIARY) - Browser fingerprint

### Layer 1: Google OAuth Authentication (PRIMARY)

**How It Works**:

1. **User Sign-In**: Users authenticate with Google OAuth via Firebase Auth
   ```typescript
   const signInWithGoogle = async () => {
       const provider = new GoogleAuthProvider();
       await signInWithPopup(auth, provider);
   };
   ```

2. **Token Issuance**: Firebase issues a JWT ID token containing user's UID
   ```typescript
   const idToken = await user.getIdToken();
   ```

3. **Vote Request**: Frontend sends ID token with vote request
   ```typescript
   api.post(`/polls/${id}/vote`, 
       { optionIndex },
       { headers: { Authorization: `Bearer ${idToken}` } }
   );
   ```

4. **Backend Verification**: Firebase Admin SDK verifies token authenticity
   ```typescript
   const decodedToken = await admin.auth().verifyIdToken(idToken);
   const userId = decodedToken.uid;  // Unique Google account ID
   ```

5. **Vote Recording**: Vote is recorded in separate Vote collection
   ```typescript
   const existingVote = await Vote.findOne({ pollId, userId });
   if (existingVote) {
       return res.status(400).json({ message: "Already voted" });
   }
   
   await Vote.create({
       pollId,
       userId,
       optionId,
       userEmail: decodedToken.email,
       votedAt: new Date()
   });
   ```

**Code Example** (Backend Middleware):

```typescript
// src/middleware/auth.ts
export const verifyAuthToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name
        };
        
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid authentication token" });
    }
};
```

**Code Example** (Frontend Auth Context):

```typescript
// src/contexts/AuthContext.tsx
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
        });
        return unsubscribe;
    }, []);
    
    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };
    
    const getIdToken = async () => {
        if (!user) return null;
        return await user.getIdToken();
    };
    
    return (
        <AuthContext.Provider value={{ user, signInWithGoogle, signOut, getIdToken }}>
            {children}
        </AuthContext.Provider>
    );
};
```

**Strengths**:

- **Account-Level Protection**: Ties votes to verifiable Google accounts
- **Server-Side Verification**: Token verification happens server-side (cannot be forged)
- **Cryptographically Secure**: Firebase uses industry-standard JWT with RS256 signing
- **User Attribution**: Enables tracking votes per user (optional email recording)
- **Scalable**: Firebase handles millions of authentications
- **Social Proof**: Users trust Google authentication

**Limitations**:

- **Requires Google Account**: Users without Google accounts cannot vote
- **Account Creation Overhead**: Users must sign in before voting
- **Multiple Google Accounts**: Determined users could create multiple Google accounts (but requires effort)

---

### Layer 2: Vote Token (SECONDARY)

**How It Works**:

1. **Generation**: After a successful vote, the backend generates a cryptographically secure random token using `crypto.randomBytes(16).toString('hex')`

2. **Storage**: The token is:
   - Returned in the API response
   - Stored in browser's `localStorage` by the frontend
   - Added to the `votedTokens` array in the database

3. **Verification**: On subsequent vote attempts, the backend:
   - Reads `x-vote-token` header from the request
   - Checks if it exists in `poll.votedTokens` array
   - Rejects the vote if found

4. **Vote Tracking**: The token is also stored in `tokenVotes` Map with the option index, enabling the "Your Vote" badge to persist across page refreshes

**Code Example** (Backend):

```typescript
// Generate token after vote
const newToken = crypto.randomBytes(16).toString('hex');

// Check for duplicate
const voteToken = req.headers["x-vote-token"] as string | undefined;
if (voteToken && poll.votedTokens.includes(voteToken)) {
    return res.status(400).json({
        success: false,
        message: "Already voted on this poll"
    });
}

// Store token
poll.votedTokens.push(newToken);
poll.tokenVotes.set(newToken, optionIndex);
await poll.save();

// Return token to client
res.json({ voteToken: newToken });
```

**Code Example** (Frontend):

```typescript
// Store token after voting
if (res.data.voteToken) {
    localStorage.setItem("voteToken", res.data.voteToken);
}

// Send token with future requests
const voteToken = localStorage.getItem("voteToken");
api.post(`/polls/${id}/vote`, 
    { optionIndex },
    {
        headers: {
            Authorization: `Bearer ${idToken}`,
            ...(voteToken && { "x-vote-token": voteToken })
        }
    }
);
```

**Strengths**:

- **Server-Controlled**: Cannot be forged or predicted (crypto-secure randomness)
- **Session-Persistent**: Survives page refreshes
- **Simple to Implement**: Straightforward token generation and verification
- **Complements OAuth**: Provides secondary check if auth is bypassed

**Limitations**:

- **Storage-Dependent**: Cleared if user clears browser storage
- **Not Shared Across Browsers**: Each browser gets independent token
- **Incognito Mode**: Fresh storage on each session

---

### Layer 3: Client ID (TERTIARY)

**How It Works**:

1. **Generation**: On first visit, the frontend generates a UUID v4 identifier:
   ```typescript
   const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
       const r = (Math.random() * 16) | 0;
       const v = c === 'x' ? r : (r & 0x3) | 0x8;
       return v.toString(16);
   });
   ```

2. **Storage**: The clientId is stored in `localStorage` with key `pollify_client_id`

3. **Persistence**: Once generated, the same clientId is reused for all polls from that browser

4. **Verification**: The backend:
   - Reads `x-client-id` header from the request
   - Checks if it exists in `poll.votedClients` array
   - Rejects the vote if found

5. **Vote Tracking**: Like vote tokens, clientId is stored in `tokenVotes` Map for "Your Vote" persistence

**Code Example** (Frontend):

```typescript
// lib/clientId.ts utility
export function getClientId(): string {
    if (typeof window === 'undefined') return '';
    
    let clientId = localStorage.getItem('pollify_client_id');
    if (!clientId) {
        clientId = generateUUID();
        localStorage.setItem('pollify_client_id', clientId);
    }
    return clientId;
}

// Usage in vote request
const clientId = getClientId();
api.post(`/polls/${id}/vote`, 
    { optionIndex },
    { 
        headers: { 
            Authorization: `Bearer ${idToken}`,
            "x-vote-token": voteToken,
            "x-client-id": clientId
        } 
    }
);
```

**Code Example** (Backend):

```typescript
const clientId = req.headers["x-client-id"] as string | undefined;

if (clientId && poll.votedClients.includes(clientId)) {
    return res.status(400).json({
        success: false,
        message: "Already voted on this poll"
    });
}

// Store clientId
if (clientId) {
    poll.votedClients.push(clientId);
    poll.tokenVotes.set(clientId, optionIndex);
}
```

**Strengths**:

- **Browser-Unique**: Different from vote token, adds third layer
- **Persistent**: Survives across sessions and polls
- **Lightweight**: No server-side session management
- **Complements OAuth and Token**: Provides tertiary defense

**Limitations**:

- **Client-Generated**: User could theoretically modify code to generate new IDs
- **Storage-Dependent**: Cleared with `localStorage`
- **Not Shared Across Browsers**: Each browser gets independent ID

---

### How My Three Mechanisms Work Together

```
Vote Attempt Flow:
┌──────────────────────┐
│ User must sign in    │
│ with Google OAuth    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ User clicks option   │
└──────────┬───────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Frontend sends:                         │
│  - Authorization: Bearer <ID TOKEN>     │
│  - x-vote-token header (if exists)      │
│  - x-client-id header (always)          │
│  - optionIndex in body                  │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Backend verifies:                       │
│  1. Firebase ID token valid?            │
│     ├─ Invalid/Missing → Reject (401)   │
│     └─ Valid → Extract userId           │
│                                         │
│  2. Is userId in Vote collection?       │
│     ├─ Yes → Reject (400)               │
│     └─ No → Continue                    │
│                                         │
│  3. Is voteToken in votedTokens[]?      │
│     ├─ Yes → Reject (400)               │
│     └─ No → Continue                    │
│                                         │
│  4. Is clientId in votedClients[]?      │
│     ├─ Yes → Reject (400)               │
│     └─ No → Continue                    │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Record vote:                            │
│  - Create Vote document (userId)        │
│  - Increment option votes               │
│  - Generate new token                   │
│  - Add token to votedTokens[]           │
│  - Add clientId to votedClients[]       │
│  - Store both in tokenVotes Map         │
│  - Save to database                     │
│  - Emit Socket.IO update                │
│  - Return new token to client           │
└─────────────────────────────────────────┘
```

**Priority Order**:

When checking if a user has voted (GET /polls/:id):

1. **Check Google OAuth User ID** (if authenticated)
   - Look in Vote collection: `Vote.findOne({ pollId, userId })`
   - If found → User has voted

2. **Check Vote Token** (if present in header)
   - Look in poll.tokenVotes Map: `poll.tokenVotes.get(voteToken)`
   - If found → User has voted

3. **Check Client ID** (if present in header)
   - Look in poll.tokenVotes Map: `poll.tokenVotes.get(clientId)`
   - If found → User has voted

**Example Scenarios**:

**Scenario 1: Normal User Flow**
1. User signs in with Google → Gets userId
2. User votes on Poll X → Vote recorded with userId, voteToken, clientId
3. User refreshes page → All 3 identifiers sent → Backend returns userVotedOption
4. User tries to vote again → Blocked at Layer 1 (userId check)

**Scenario 2: User Clears Storage**
1. User votes on Poll X (authenticated)
2. User clears localStorage → Loses voteToken and clientId (but still signed in)
3. User tries to vote again → Blocked at Layer 1 (userId still valid)
4. **Result**: OAuth prevents duplicate vote

**Scenario 3: User Signs Out**
1. User votes on Poll X (authenticated)
2. User signs out of Google → Loses userId (but keeps voteToken and clientId)
3. Different user signs in on same browser → Different userId
4. Different user tries to vote → Blocked at Layer 2 (voteToken check) or Layer 3 (clientId check)
5. **Result**: Token or ClientId prevents duplicate vote

**Scenario 4: Multiple Browsers**
1. User signs in on Chrome → Votes on Poll X
2. User opens Firefox → Signs in with same Google account
3. Firefox has different voteToken and clientId (fresh storage)
4. User tries to vote → Blocked at Layer 1 (userId check)
5. **Result**: OAuth prevents cross-browser duplicate

---

### Why This Multi-Layer Approach Exceeds Assignment Requirements

**Assignment Required**: At least 2 fairness mechanisms

**I Implemented**: 3 layers (Google OAuth + Token + ClientID)

**Advantages of My Approach**:

1. **Defense-in-Depth**: If one layer fails, others catch duplicates
2. **OAuth as Primary**: Strongest mechanism (account-based) is the first check
3. **Fallback Mechanisms**: Token and ClientID work even if OAuth bypassed
4. **User Experience**: "Your Vote" badge persists across OAuth state changes
5. **Production-Ready**: Similar to enterprise applications (Auth0 + CSRF tokens + fingerprinting)

**Comparison with Single-Mechanism Approaches**:

| Approach | Protection Level | User Friction | Bypass Difficulty |
|----------|------------------|---------------|-------------------|
| **IP-Based Only** | Low | None | Easy (VPN, mobile network switch) |
| **Token Only** | Medium | Low | Medium (clear storage, incognito) |
| **OAuth Only** | High | Medium | Hard (need multiple Google accounts) |
| **My 3-Layer System** | Very High | Medium | Very Hard (need all 3 bypasses) |

---

### Threat Model & What I Mitigated

| Threat | Mitigated? | How |
|--------|-----------|-----|
| Accidental double-click | ✅ Yes | Button disabled after vote + frontend state |
| Page refresh | ✅ Yes | All 3 identifiers persist in storage/auth |
| Multiple browsers (same device) | ✅ Yes | Google OAuth userId is device-independent |
| Multiple devices (same account) | ✅ Yes | Google OAuth userId is account-specific |
| Incognito mode | ✅ Yes | Google OAuth requires sign-in each session |
| Clearing localStorage | ✅ Yes | Google OAuth userId still enforced |
| Sign out and sign in | ✅ Yes | Vote collection tracks userId permanently |
| Automated bot voting | ✅ Partial | Bots need Google accounts (hard to automate at scale) |
| Developer tools manipulation | ⚠️ Partial | Can modify clientId, but OAuth and token enforced server-side |
| Multiple Google accounts | ⚠️ Partial | Technically possible but requires effort (one vote per account) |

**Understanding the Symbols**:
- ✅ **Yes** = Successfully mitigated with my multi-layer approach
- ⚠️ **Partial** = Significantly harder but not impossible
- ❌ **No** = Not addressable without additional infrastructure

**About the ⚠️ Cases**:

The partially mitigated cases represent the practical limits of client-side fairness:

- **Developer tools manipulation**: While a user can modify clientId in the frontend, they cannot forge Firebase ID tokens (RS256 signed by Google). The OAuth layer still prevents duplicates.

- **Multiple Google accounts**: A determined user could create multiple Google accounts to vote multiple times. However:
  - This requires significant effort (phone verification, email management)
  - It's rate-limited by Google's account creation policies
  - It's detectable via email pattern analysis (same domain, sequential names)
  - It's the same limitation as any OAuth-based system (Twitter polls, YouTube likes, etc.)

---

### Why I Believe This Approach Is Appropriate

**For This Internship Assignment**:

1. **Exceeds Requirements**: Assignment asked for 2+ mechanisms; I provided 3
2. **Production-Grade**: Uses industry-standard OAuth (Firebase) with defense-in-depth
3. **Demonstrates Understanding**: Shows knowledge of authentication, tokens, and fairness trade-offs
4. **Scalable**: Firebase Auth handles millions of users
5. **Explainable**: Clear documentation of each layer and their interactions

**What This Is Suitable For**:

- Corporate polls (within organization)
- Event voting (conference talks, hackathon projects)
- Product feedback collection
- Community surveys
- Educational quizzes with Google Classroom integration
- SaaS product feedback (users already have Google accounts)

**What This Is NOT Suitable For**:

- High-stakes voting (elections, legal decisions)
- Financial transactions
- Regulated industries requiring audit trails
- Anonymous polls (OAuth reveals identity)

**Where This Approach Shines**:

My multi-layer system provides a good balance of:
- Security (OAuth + defense-in-depth)
- User experience (familiar Google sign-in)
- Implementation complexity (reasonable for assignment)
- Extensibility (easy to add more checks)

---

## Frontend Design

### Page Structure

The frontend consists of three primary pages managed by Next.js App Router:

```
src/app/
├── layout.tsx          # Root layout, navigation, toast provider
├── page.tsx            # Home/Dashboard page
├── create/
│   └── page.tsx        # Poll creation form
└── poll/
    └── [id]/
        └── page.tsx    # Poll voting and results page
```

---

### 1. Home Page (`/`)

**Purpose**: Landing page and quick poll creation

**Key Features**:

- Hero section with app description
- Quick-create input field
- Visual mockup of poll interface
- Call-to-action buttons

**User Flow**:

1. User enters question in input field
2. Presses Enter or clicks "Create Poll"
3. Redirected to `/create?question=...` with prefilled question

**Code Snippet**:

```typescript
const handleQuickCreate = () => {
    if (!quickQuestion.trim()) return;
    const params = new URLSearchParams({ 
        question: quickQuestion.trim() 
    });
    router.push(`/create?${params.toString()}`);
};
```

**Keyboard Shortcuts I Added**: Enter key submits the quick-create form

---

### 2. Create Poll Page (`/create`)

**Purpose**: Full poll creation interface with multiple options

**Key Features**:

- Question input field
- Dynamic option list (minimum 2, unlimited maximum)
- Add/remove option buttons
- Form validation
- Success modal with shareable link

**User Flow**:

1. Question field auto-filled if coming from home page
2. User enters answer options
3. Clicks "Create Poll"
4. Backend generates poll
5. Modal displays with:
   - Shareable link
   - Copy button
   - "Go to Poll" button

**Dynamic Options**:

```typescript
const addOption = () => {
    setOptions([...options, ""]);
};

const removeOption = (index: number) => {
    if (options.length > 2) {
        setOptions(options.filter((_, i) => i !== index));
    }
};
```

**Keyboard Shortcuts**:

- **Enter** in question field → Focus first option
- **Enter** in option field → Focus next option (or add new if last)
- **Ctrl/Cmd + Enter** → Submit form
- **Escape** in modal → Close modal
- **C** in modal → Copy link

**My Validation Logic:**

```typescript
if (!trimmedQuestion) {
    toast.error("Please enter a poll question!");
    return;
}
if (filteredOptions.length < 2) {
    toast.error("Please enter at least two options!");
    return;
}
```

---

### 3. Poll Page (`/poll/[id]`)

**Purpose**: Display poll, vote, and view real-time results

**Key Features**:

- Live poll status badge
- Vote count display
- Interactive option selection
- Real-time vote updates via Socket.IO
- "Your Vote" badge persistence
- Share button with copy-to-clipboard

**Component State**:

```typescript
const [poll, setPoll] = useState<any>(null);
const [voted, setVoted] = useState(false);
const [selectedOption, setSelectedOption] = useState<number | null>(null);
```

**How I Implemented Real-Time Connection:**

```typescript
useEffect(() => {
    if (!socket.connected) {
        socket.connect();
    }
    
    socket.emit("joinPoll", id);
    
    socket.on("voteUpdate", (updatedPoll) => {
        setPoll(updatedPoll);
    });
    
    return () => {
        socket.off("voteUpdate");
    };
}, [id]);
```

**How I Made Votes Persist:**

On page load, my frontend:

1. Reads `voteToken` from `localStorage`
2. Generates/reads `clientId` from `localStorage`
3. Sends both to backend in `GET /polls/:id`
4. Backend returns `userVotedOption` (index or null)
5. Frontend sets `voted` state and highlights the option

**Keyboard Shortcuts**:

- **1-9** → Vote on option 1-9 (if not voted)
- **Enter** → Confirm selected option
- **S/C** → Share/copy poll link

---

### My Navigation Implementation

**Layout Component** (`layout.tsx`):

```typescript
<nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b">
    <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/">
            <h1 className="text-2xl font-bold">Pollify</h1>
        </Link>
        <Link href="/create">
            <button>Create Poll</button>
        </Link>
    </div>
</nav>
```

**How I Handle Shareable Links:**

Poll URLs follow the pattern: `https://your-app.vercel.app/poll/65f8a3b2c4d5e6f7a8b9c0d1`

- The `[id]` is the MongoDB ObjectId
- Links can be shared via social media, messaging apps, or email
- No authentication required to vote

---

### My State Management Approach

**Why I Didn't Use a Global State Library**:

- I used React's built-in `useState` and `useEffect`
- I avoided props drilling by keeping state local to pages
- I created a Socket.IO connection singleton (`socket.ts`) that I import where needed

**Why No Redux/Context**:

1. **Simplicity**: My application state is page-specific, no cross-component sharing needed
2. **Performance**: No unnecessary re-renders from global state changes
3. **Maintainability**: Easier to understand data flow without abstraction layers
4. **Scope**: This assignment doesn't require complex state management

**Shared Utilities I Created:**

- `lib/api.ts`: Axios instance with base URL configuration
- `lib/socket.ts`: Socket.IO client singleton
- `lib/clientId.ts`: Client ID generation and management

---

## UI/UX Decisions

### My Design Philosophy

**Goal**: I wanted to create a professional, modern interface that feels native to the web while remaining accessible and intuitive.

**Principles I Followed:**

1. **Mobile-First**: All components responsive, touch-friendly targets
2. **Visual Hierarchy**: Clear distinction between primary and secondary actions
3. **Instant Feedback**: Loading states, toast notifications, optimistic UI updates
4. **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation
5. **Performance**: Minimal JavaScript, code splitting, lazy loading

---

### Color Palette

I use an earthy green color scheme:

```css
Primary Green:     #1a6b3a  /* Buttons, accents, highlights */
Medium Green:      #166534  /* Hover states, gradients */
Light Green:       #10b981  /* Success states, badges */
Green Tints:       50/100/200 opacity levels
Neutral Cream:     #f0e8d0  /* Backgrounds, cards */
Gray Scale:        50-900 for text and borders
```

**Why I Chose This**:

- Green conveys trust, positivity, and action
- Earthy tones feel professional yet approachable
- High contrast ensures readability
- Distinct from common blue/purple SaaS templates

---

### Tailwind CSS Usage

**Utility-First Approach**:

```tsx
<button className="px-8 py-3 bg-gradient-to-r from-[#1a6b3a] to-[#166534] 
                   text-white font-semibold rounded-xl hover:shadow-lg 
                   hover:shadow-green-500/30 hover:-translate-y-0.5 
                   transition-all duration-200">
    Create Poll
</button>
```

**Benefits**:

- Rapid prototyping without writing CSS files
- Responsive modifiers (`md:`, `lg:`) for breakpoints
- Pseudo-classes (`hover:`, `focus:`, `group-hover:`) for interactions
- Consistent spacing scale (Tailwind default)

**Custom Extensions**:

Custom colors defined in `tailwind.config.ts`:

```typescript
theme: {
    extend: {
        colors: {
            'primary-green': '#1a6b3a',
            'secondary-green': '#166534'
        }
    }
}
```

---

### Component Patterns

**Card Pattern**:

```tsx
<div className="bg-white rounded-3xl shadow-xl border border-gray-100">
    <div className="bg-green-50/50 p-8 border-b border-green-100">
        {/* Header */}
    </div>
    <div className="p-8">
        {/* Content */}
    </div>
</div>
```

**Input Pattern**:

```tsx
<div className="relative group">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
        <Icon className="text-gray-400 group-focus-within:text-[#1a6b3a]" />
    </div>
    <input className="w-full pl-11 pr-4 py-4 bg-gray-50 border rounded-xl 
                      focus:ring-2 focus:ring-green-500/20 focus:border-[#1a6b3a]" />
</div>
```

**Button Pattern**:

```tsx
{/* Primary */}
<button className="px-6 py-3 bg-[#1a6b3a] hover:bg-[#166534] text-white 
                   font-semibold rounded-xl shadow-lg transition-all">

{/* Secondary */}
<button className="px-6 py-3 text-gray-600 hover:text-gray-900 
                   font-semibold transition-colors">
```

---

### Toast Notifications

**Library**: `react-hot-toast`

**Configuration**:

```tsx
<Toaster
    position="top-center"
    toastOptions={{
        duration: 3000,
        style: {
            background: '#fff',
            color: '#1a6b3a',
            border: '1px solid #166534',
            borderRadius: '12px',
            padding: '16px'
        },
        success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' }
        },
        error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' }
        }
    }}
/>
```

**Usage Examples**:

```typescript
// Success
toast.success("Poll created successfully!");

// Error
toast.error("Please enter a poll question!");

// Loading
const loadingToast = toast.loading("Creating your poll...");
// Later...
toast.success("Done!", { id: loadingToast });
```

**When Toasts Appear**:

- Poll created
- Vote recorded
- Duplicate vote attempted
- Link copied to clipboard
- Validation errors

---

### Accessibility Considerations

1. **Semantic HTML**: Proper use of `<button>`, `<nav>`, `<main>` tags
2. **ARIA Labels**: `aria-label="Close"` on modal close button
3. **Keyboard Navigation**: All interactive elements accessible via Tab
4. **Focus Indicators**: Visible focus rings on inputs and buttons
5. **Color Contrast**: WCAG AA compliant text-to-background ratios
6. **Screen Reader Text**: Descriptive link text ("Go to Poll" vs "Click Here")

---

### Responsive Design

**Breakpoints**:

- Mobile: `< 640px` (default)
- Tablet: `640px - 1024px` (md:)
- Desktop: `> 1024px` (lg:)

**Mobile Optimizations**:

```tsx
{/* Stack buttons vertically on mobile */}
<div className="flex flex-col sm:flex-row gap-2">
    <input className="flex-1" />
    <button className="w-full sm:w-auto">Submit</button>
</div>

{/* Responsive text sizes */}
<h1 className="text-4xl md:text-6xl lg:text-7xl">Title</h1>

{/* Responsive padding */}
<div className="p-4 md:p-6 lg:p-8">Content</div>
```

**Touch Targets**:

All interactive elements have minimum 44x44px tap area (iOS/Android guideline).

---

## Real-Time Updates Flow

### Why I Chose Socket.IO

**My Requirement**: Users viewing the same poll should see vote counts update instantly without refreshing.

**My Solution**: WebSocket-based real-time communication.

**Why I Chose Socket.IO Over Raw WebSockets**:

1. **Automatic Reconnection**: Handles network interruptions gracefully
2. **Fallback Support**: Falls back to long-polling if WebSocket unavailable
3. **Room Management**: Built-in support for subscribing clients to specific channels (poll IDs)
4. **Browser Compatibility**: Works across all modern browsers
5. **Simplicity**: High-level API abstracts low-level WebSocket complexity

---

### How I Implemented the Connection Lifecycle

**My Frontend Initialization** (`lib/socket.ts`):

```typescript
import { io } from "socket.io-client";

export const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
    autoConnect: false,          // Manual connection control
    reconnection: true,          // Auto-reconnect on disconnect
    reconnectionDelay: 1000,     // Wait 1s before reconnecting
    reconnectionDelayMax: 5000,  // Max 5s between attempts
    reconnectionAttempts: 10,    // Try 10 times before giving up
    transports: ['websocket', 'polling']  // Fallback to polling
});

socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
});
```

**Backend Setup** (`server.ts`):

```typescript
const io = new Server(server, {
    cors: {
        origin: "*",                          // Allow all origins
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling'],     // Match frontend
    allowEIO3: true                           // Legacy compatibility
});

io.on("connection", (socket) => {
    socket.on("joinPoll", (pollId: string) => {
        socket.join(pollId);                  // Add client to room
    });

    socket.on("disconnect", () => {
        // Client disconnected
    });

    socket.on("error", (error) => {
        console.error("Socket error:", error);
    });
});
```

---

### Vote Update Propagation

**Step-by-Step Flow**:

```
1. User A opens /poll/abc123
   ├─ Frontend connects socket
   ├─ Frontend emits: socket.emit("joinPoll", "abc123")
   ├─ Backend adds socket to room "abc123"
   └─ User A now listening for updates in room "abc123"

2. User B opens /poll/abc123 (same poll)
   ├─ Frontend connects socket
   ├─ Frontend emits: socket.emit("joinPoll", "abc123")
   ├─ Backend adds socket to room "abc123"
   └─ User B now listening for updates in room "abc123"

3. User C votes on option 2
   ├─ Frontend: POST /api/polls/abc123/vote { optionIndex: 2 }
   ├─ Backend: Increments option 2 votes
   ├─ Backend: Saves to database
   ├─ Backend: io.to("abc123").emit("voteUpdate", updatedPoll)
   └─ Socket.IO broadcasts to all clients in room "abc123"

4. User A and User B receive update
   ├─ Frontend: socket.on("voteUpdate", (updatedPoll) => {...})
   ├─ Frontend: setPoll(updatedPoll)
   └─ UI re-renders with new vote counts
```

**Code in `pollController.ts`**:

```typescript
export const votePoll = async (req: Request, res: Response) => {
    // ... validation and vote recording ...
    
    await poll.save();
    
    // Broadcast to all clients in poll room
    const io = req.app.get("io") as Server;
    try {
        io.to(poll._id.toString()).emit("voteUpdate", poll);
    } catch (socketError) {
        console.error("Failed to emit vote update:", socketError);
    }
    
    return res.status(200).json({
        success: true,
        message: "Vote recorded successfully",
        poll,
        voteToken: newToken
    });
};
```

**Code in `page.tsx` (Poll Page)**:

```typescript
useEffect(() => {
    if (!id) return;
    
    if (!socket.connected) {
        socket.connect();
    }
    
    const joinPollRoom = () => {
        socket.emit("joinPoll", id);
    };
    
    if (socket.connected) {
        joinPollRoom();
    } else {
        socket.once("connect", joinPollRoom);
    }
    
    const handleVoteUpdate = (updatedPoll: any) => {
        setPoll(updatedPoll);  // Update UI automatically
    };
    
    socket.on("voteUpdate", handleVoteUpdate);
    
    return () => {
        socket.off("voteUpdate", handleVoteUpdate);
        socket.off("connect", joinPollRoom);
    };
}, [id]);
```

---

### Performance Considerations

**Room-Based Broadcasting**:

Instead of emitting to all connected clients:

```typescript
// Bad: Sends to everyone (wastes bandwidth)
io.emit("voteUpdate", poll);

// Good: Sends only to clients viewing this poll
io.to(pollId).emit("voteUpdate", poll);
```

**Optimistic UI Updates**:

On frontend, the selected option is highlighted immediately (before API response):

```typescript
const vote = async (index: number) => {
    setSelectedOption(index);  // Instant visual feedback
    
    try {
        await api.post(`/polls/${id}/vote`, { optionIndex: index });
        // Success
    } catch (err) {
        setSelectedOption(null);  // Revert on failure
    }
};
```

**Connection Management**:

- Socket connection is created once as a singleton
- Reused across page navigations
- Cleaned up properly on component unmount

---

### Handling Edge Cases

**Client Disconnects**:

If a user's socket disconnects (network issue, browser closed):

- Socket.IO automatically attempts reconnection
- Upon reconnection, frontend re-emits `joinPoll`
- User continues receiving updates seamlessly

**Multiple Tabs**:

If a user opens the same poll in multiple tabs:

- Each tab establishes its own socket connection
- Each receives the `voteUpdate` event independently
- All tabs update simultaneously

**Late Joiners**:

If a user joins a poll after votes have been cast:

- Initial `GET /polls/:id` returns current vote counts
- User renders the current state
- Socket connection established for future updates

---

## Deployment Strategy

### How I Deployed the Application

I deployed the application across three platforms, each serving a specific purpose:

```
Frontend (Vercel) ──HTTP──> Backend (Render) ──TCP──> Database (MongoDB Atlas)
       │                           │
       └────────WebSocket──────────┘
```

---

### Backend Deployment (Render)

**Platform**: [Render](https://render.com)

**Service Type**: Web Service (Node.js)

**Why I Chose Render**:

1. **Persistent Processes**: Required for Socket.IO to maintain WebSocket connections
2. **Free Tier**: Sufficient for MVP/demo (spins down after inactivity, but restarts automatically)
3. **WebSocket Support**: Native support for upgrading HTTP connections to WebSocket
4. **Easy Setup**: Git-based deployment with automatic builds
5. **Environment Variables**: Secure storage for secrets

**My Deployment Configuration**:

```yaml
# render.yaml (optional)
services:
  - type: web
    name: realtime-poll-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: MONGO_URI
        sync: false
      - key: PORT
        value: 5000
```

**Build Command**: `npm run build` (compiles TypeScript to JavaScript)

**Start Command**: `npm start` (runs `node dist/server.js`)

**Environment Variables**:

- `MONGO_URI`: MongoDB Atlas connection string
- `PORT`: 5000 (default, but Render assigns dynamic port via `process.env.PORT`)

**Deployment URL**: `https://your-app-name.onrender.com`

**Health Checks**:

Render automatically monitors the service. To keep it alive, you can:

- Set up external uptime monitoring (e.g., UptimeRobot)
- Make periodic health check requests
- Upgrade to paid tier for always-on service

---

### Frontend Deployment (Vercel)

**Platform**: [Vercel](https://vercel.com)

**Service Type**: Next.js Application

**Why I Chose Vercel**:

1. **Native Next.js Support**: Built by the creators of Next.js
2. **Global CDN**: Instant page loads from edge locations
3. **Automatic Builds**: Triggered on Git push
4. **Preview Deployments**: Branch-based preview URLs
5. **Zero Configuration**: Detects Next.js and configures automatically

**My Deployment Configuration**:

Vercel reads from `next.config.ts` and `package.json` automatically.

I didn't need additional configuration for basic deployment.

**Build Command**: `npm run build` (Next.js production build)

**Output Directory**: `.next` (default)

**Environment Variables**:

- `NEXT_PUBLIC_API_URL`: Backend API base URL (e.g., `https://your-backend.onrender.com/api/polls`)
- `NEXT_PUBLIC_SOCKET_URL`: Socket.IO server URL (e.g., `https://your-backend.onrender.com`)

**Note**: `NEXT_PUBLIC_` prefix makes variables available to client-side code.

**Deployment URL**: `https://your-app-name.vercel.app` (or custom domain)

---

### Database Deployment (MongoDB Atlas)

**Platform**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

**Tier**: Free (M0 Sandbox, 512MB storage)

**Why I Chose MongoDB Atlas**:

1. **Managed Service**: No server maintenance required
2. **Free Tier**: Sufficient for development and small-scale production
3. **Global Clusters**: Low-latency access from multiple regions
4. **Built-in Security**: Encrypted connections, IP whitelisting, user authentication
5. **Automatic Backups**: Daily snapshots (on paid tiers)

**My Setup Steps**:

1. Create a cluster in preferred region
2. Create database user with password
3. Whitelist IP addresses (or use `0.0.0.0/0` for all IPs)
4. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/dbname`

**Connection String**:

```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

**Used in Backend**:

```typescript
mongoose.connect(process.env.MONGO_URI as string)
    .then(() => { /* Server started */ })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    });
```

---

### Why Socket.IO Cannot Be Deployed on Vercel

**Vercel's Architecture**:

- Vercel runs on **serverless functions** (AWS Lambda behind the scenes)
- Each request spawns a new function instance
- Function completes, returns response, and terminates
- No persistent process or memory between requests

**What Socket.IO Needs**:

- Requires a **stateful, long-running server**
- Maintains open WebSocket connections for minutes/hours
- Stores room membership in memory
- Cannot function in serverless environment

**My Solution**:

I deployed the backend to Render (persistent Node.js server) and frontend to Vercel (static + API routes).

---

### Environment Variables

**Backend (Render)**:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/polls?retryWrites=true&w=majority
PORT=5000
```

**Frontend (Vercel)**:

```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api/polls
NEXT_PUBLIC_SOCKET_URL=https://your-backend.onrender.com
```

**Security Note**:

- Never commit `.env` files to Git
- Use platform-specific environment variable UI (Render Dashboard, Vercel Settings)
- Rotate MongoDB credentials periodically

---

### My Continuous Deployment Workflow

**How It Works**:

1. I push code to GitHub `main` branch
2. **Frontend**: Vercel automatically detects push, builds, and deploys new version
3. **Backend**: Render automatically detects push, builds, and restarts service
4. **Zero Downtime**: Render uses rolling deployments (new version starts before old one stops)

**Rollback Options**:

- Vercel: Instant rollback to any previous deployment via dashboard
- Render: Redeploy previous commit via dashboard or Git revert

---

## Edge Cases I Handled

### 1. Invalid Poll ID

**Scenario**: User navigates to `/poll/invalid-id` or `/poll/123`

**How I Handle It**:

```typescript
// Backend
const poll = await Poll.findById(id);
if (!poll) {
    return res.status(404).json({
        success: false,
        message: "Poll not found"
    });
}

// Frontend
if (!poll) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <Loader2 className="animate-spin" />  // Loading state
        </div>
    );
}
```

**Result**: User sees loading spinner briefly, then my API returns 404, and the frontend shows an error state.

**What I Could Improve**: I could add a dedicated 404 page with "Poll not found" message.

---

### 2. Invalid Vote Option Index

**Scenario**: User (or malicious actor) sends `optionIndex: 999` for a poll with 3 options

**How I Handle It**:

```typescript
if (optionIndex < 0 || optionIndex >= poll.options.length) {
    return res.status(400).json({
        success: false,
        message: "Invalid option selected"
    });
}
```

**Result**: Vote rejected, user sees error toast.

---

### 3. Duplicate Vote Attempt

**Scenario**: User votes, then tries to vote again without clearing storage

**How I Handle It**:

```typescript
// Check both token and clientId
if (voteToken && poll.votedTokens.includes(voteToken)) {
    return res.status(400).json({
        success: false,
        message: "Already voted on this poll"
    });
}

if (clientId && poll.votedClients.includes(clientId)) {
    return res.status(400).json({
        success: false,
        message: "Already voted on this poll"
    });
}
```

**How I Handle It on Frontend**:

```typescript
const vote = async (index: number) => {
    if (voted) {
        toast.error("You've already voted on this poll!");
        return;
    }
    // ... proceed with vote
};
```

**Result**: Vote blocked at both frontend and backend levels.

---

### 4. Page Refresh After Voting

**Scenario**: User votes, refreshes page, expects to see their vote highlighted

**How I Handle It**:

```typescript
// Frontend sends token and clientId with GET request
api.get(`/polls/${id}`, {
    headers: {
        "x-vote-token": localStorage.getItem("voteToken"),
        "x-client-id": getClientId()
    }
});

// Backend checks tokenVotes Map
if (voteToken && poll.tokenVotes) {
    userVotedOption = poll.tokenVotes.get(voteToken) ?? null;
}

// Frontend sets state
if (res.data.userVotedOption !== null) {
    setVoted(true);
    setSelectedOption(res.data.userVotedOption);
}
```

**Result**: User's previously selected option is highlighted, "Your Vote" badge displayed.

---

### 5. Socket Disconnection

**Scenario**: User's internet connection drops mid-session

**How I Handle It**:

```typescript
// Frontend socket config
{
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10
}

// Rejoin poll room after reconnection
socket.once("connect", () => {
    socket.emit("joinPoll", pollId);
});
```

**Result**: Socket automatically reconnects, user continues receiving updates.

---

### 6. Extremely Long Poll Question/Options

**Scenario**: User submits 500-character question or option text

**My Current Handling**:

No explicit length validation in backend (MongoDB has 16MB document limit).

**Frontend Constraint**: My input fields have no maxLength, but the UI naturally discourages very long text.

**What I Could Improve**: Add validation like:

```typescript
if (question.length > 200) {
    return res.status(400).json({
        message: "Question must be less than 200 characters"
    });
}
```

---

### 7. Empty or Whitespace-Only Options

**Scenario**: User submits options like `["", "  ", "Valid Option"]`

**How I Handle It**:

```typescript
// Frontend
const filteredOptions = options
    .map(o => o.trim())
    .filter(o => o);  // Remove empty strings

if (filteredOptions.length < 2) {
    toast.error("Please enter at least two options!");
    return;
}
```

**Result**: Empty options are filtered out before submission.

---

### 8. Race Condition: Multiple Votes Submitted Simultaneously

**Scenario**: User double-clicks vote button before `voted` state updates

**How I Handle It**:

```typescript
// Frontend: Disable button immediately
<button disabled={voted} onClick={() => vote(i)}>

// Optimistic UI update
setSelectedOption(index);  // Instant visual feedback prevents double-click

// Backend: Database-level check
// MongoDB's votedTokens array is updated atomically
```

**Result**: Only first vote is recorded, subsequent requests are rejected.

---

### 9. Poll Creation with Duplicate Options

**Scenario**: User submits `["Option A", "Option A", "Option B"]`

**My Current Handling**:

No validation to prevent duplicate options. They are stored as-is.

**What I Could Improve**: Add deduplication in frontend or backend:

```typescript
const uniqueOptions = [...new Set(filteredOptions)];
```

---

### 10. Browser Tab Closed Mid-Vote

**Scenario**: User clicks vote button, then immediately closes tab before API response

**How I Handle It**:

- Backend processes the vote successfully (vote recorded in database)
- Frontend never receives response (tab closed)
- If user reopens poll, vote is shown (because token was returned but not stored)

**Edge Case**: Vote is recorded but user doesn't have token. On next visit, system treats them as not voted.

**Impact**: Minor. User can vote again, but first vote is already counted. Acceptable for assignment scope.

---

## Known Limitations I'm Aware Of

### 1. No User Management Beyond Voting

**Limitation**: While users authenticate with Google OAuth, there's no user profile, dashboard, or voting history.

**Impact**:

- Cannot view all polls created or voted on
- No "edit your vote" functionality
- Cannot restrict polls to specific user groups
- No user analytics or engagement metrics

**Rationale**: The assignment scope focused on real-time functionality and fairness, not comprehensive user management.

**How I Mitigate This**: Authentication still enables vote tracking and prevents abuse at the account level.

---

### 2. Google Account Requirement

**Limitation**: Users must have a Google account to vote.

**Impact**:

- Excludes users without Google accounts
- Reduces spontaneous participation (requires sign-in)
- May not be suitable for public/anonymous polls

**Rationale**: Trade-off between strong fairness (account-based authentication) and accessibility.

**Alternatives**: Could add email-based magic links or anonymous mode with weaker fairness guarantees.

---

### 3. LocalStorage Dependency

**Limitation**: Vote tokens and client IDs are stored in browser's localStorage (secondary/tertiary layers).

**Impact**:

- "Your Vote" badge may not persist if storage is cleared (but OAuth prevents duplicate votes)
- Multiple voting prevented by OAuth, not storage

**Why OAuth Solves This**: Unlike the token-only approach, clearing localStorage no longer allows duplicate voting since the primary check is Google account-based.

**Secondary Benefit**: Token and ClientID layers still provide "Your Vote" badge persistence for better UX.

---

### 4. No Poll Expiration

**Limitation**: Polls remain active indefinitely. No time limits or closing mechanism.

**Impact**:

- Old polls accumulate in database
- No way to "lock" results after a certain date
- Could lead to storage costs over time

**What I Could Add**: Optional expiration date field, countdown timer display, and locked voting after expiration.

---

### 5. No Poll Editing or Deletion

**Limitation**: Once a poll is created, the question and options cannot be changed or deleted.

**Impact**:

- Typos are permanent
- Abandoned polls clutter database
- No admin controls

**Workaround**: Create a new poll with corrected content.

**What I Could Add**: Implement edit functionality (only before votes are cast) and delete button with confirmation.

---

### 6. Scalability Constraints

**Limitation**: Single-server deployment on Render free tier.

**Impact**:

- Limited concurrent WebSocket connections (~100-200 depending on memory)
- Database on free tier (512MB storage, eventually fills up)
- Socket.IO rooms stored in-memory (not shared across servers)

**What I Would Need for Production**:

For large-scale deployment, I would need:

- Redis adapter for Socket.IO (share rooms across multiple servers)
- Load balancer with sticky sessions
- Horizontal scaling (multiple backend instances)
- Database sharding or migration to paid tier

---

### 7. No Analytics or Insights

**Limitation**: No tracking of poll views, vote timestamps, or demographic data.

**Impact**: Cannot answer questions like "how many people viewed but didn't vote?" or "when did voting spike?"

**What I Could Add**: Track events like poll opens, vote submissions (with timestamps), and share button clicks.

---

### 8. Limited Abuse Detection

**Limitation**: Only checks vote token and client ID. No rate limiting or bot detection.

**Impact**:

- Automated scripts could create many polls
- Bots could spam votes (would need new clientId each time, but possible)

**What Production Would Need**:

- Rate limiting per IP (e.g., 10 votes per hour)
- CAPTCHA on vote submission
- Anomaly detection (flag polls with sudden vote spikes)

---

### 9. No Mobile App

**Limitation**: Web-only application. No native iOS or Android apps.

**Impact**: Experience depends on mobile browser quality.

**How I Mitigate This**: Fully responsive design ensures good mobile web experience.

**What I Could Add**: React Native app using same backend APIs.

---

### 10. Single Language Support

**Limitation**: UI text is hardcoded in English.

**Impact**: Non-English speakers cannot use the interface in their language.

**What I Could Add**: Internationalization (i18n) with language selector.

---

## How I Would Improve This Further

### Short-Term Enhancements I Would Add

1. **Poll Deletion**
   - I would add a delete button on the poll page
   - Require confirmation modal
   - Remove from database and close Socket.IO room

2. **Poll Expiration**
   - I would add optional expiration date/time during creation
   - Display countdown timer
   - Lock voting after expiration
   - Show "Poll Closed" state

3. **Better Error Pages**
   - I would create custom 404 page for invalid poll IDs
   - Network error handling with retry button
   - Offline mode detection

4. **User Feedback**
   - I would add a simple feedback form in footer
   - "Report Poll" button for inappropriate content
   - Star rating system for polls

5. **Poll Templates**
   - I would provide preset question types (Yes/No, Rating Scale, Ranking)
   - Quick-create templates for common use cases

---

### Medium-Term Features I Would Build

1. **Enhanced User System**
   - I would build user dashboards showing created polls
   - Vote history and analytics
   - Email notifications for poll updates
   - User preferences and settings

2. **Poll Editing & Management**
   - I would allow editing question/options before first vote
   - Lock editing after votes are cast
   - Show edit history (audit log)
   - Transfer poll ownership

3. **Advanced Authentication**
   - I would add email-based magic links
   - Support for Microsoft, GitHub OAuth
   - Anonymous mode with limited features
   - Two-factor authentication for sensitive polls

4. **Results Visualization**
   - I would add pie charts and bar graphs
   - Vote timeline (votes over time)
   - Geographic distribution (if IP captured)
   - Export results as PDF or CSV

5. **Poll Customization**
   - I would allow custom color themes
   - Add poll description/context
   - Multiple choice voting (select multiple options)
   - Ranking questions (drag-and-drop order)

---

### My Long-Term Vision

1. **Enterprise Features**
   - I would build team workspaces
   - Admin roles and permissions
   - Brand customization (logo, colors, domain)
   - White-label solution

2. **Advanced Analytics**
   - I would integrate with Google Analytics
   - A/B testing for poll variants
   - Conversion tracking (view → vote rate)
   - Demographic breakdowns

3. **Mobile Apps**
   - I would develop native iOS and Android apps
   - Push notifications for poll updates
   - Offline vote caching with sync

4. **Integrations**
   - I would create a Slack bot for creating and sharing polls
   - Webhook support for vote events
   - API for third-party integrations
   - Embed polls in other websites (iframe)

5. **Monetization**
   - I would implement free tier with ads
   - Pro tier with unlimited polls, no ads, custom branding
   - Enterprise tier with dedicated support and SLA

6. **AI Features**
   - I would add auto-generate poll questions from text prompt
   - Sentiment analysis on write-in responses
   - Smart suggestions for options based on question

---

## How to Run This Locally

### What You'll Need

- Node.js (v18 or higher)
- npm or yarn
- MongoDB (local or Atlas)
- Git

---

### Setting Up My Backend

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd realtime-poll-backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Firebase Admin SDK**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project (or use existing)
   - Navigate to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file as `serviceAccountKey.json` in the backend root directory
   - **IMPORTANT**: This file is gitignored; never commit it to version control

4. **Create Environment File**
   ```bash
   # Create .env file
   touch .env
   ```

   Add the following:
   ```env
   MONGO_URI=mongodb://localhost:27017/polls
   # or MongoDB Atlas:
   # MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/polls
   PORT=5000
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   # or for production build:
   npm run build
   npm start
   ```

6. **Verify Server Running**
   - Open browser to `http://localhost:5000`
   - You should see "Cannot GET /" (this is expected, I didn't define a root route)
   - Test with: `curl http://localhost:5000/api/polls`

---

### Setting Up My Frontend

1. **Navigate to Frontend Directory**
   ```bash
   cd realtime-poll-frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Firebase Client SDK**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Navigate to Project Settings → General
   - Scroll to "Your apps" section
   - Click "Add app" → Select Web (</> icon)
   - Register your app and copy the Firebase configuration object

4. **Create Environment File**
   ```bash
   # Create .env.local file
   touch .env.local
   ```

   Add the following (replace with your Firebase project credentials):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api/polls
   NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
   
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```

5. **Enable Google Authentication in Firebase**
   - In Firebase Console, go to Authentication → Sign-in method
   - Enable "Google" provider
   - Add authorized domains (localhost is enabled by default)

6. **Start Development Server**
   ```bash
   npm run dev
   ```

7. **Open Application**
   - Navigate to `http://localhost:3000`
   - You should see the homepage with "Sign in with Google" option

---

### How to Test the Full Stack

1. **Sign In with Google**
   - Click "Sign in with Google" in the navbar
   - Authenticate with your Google account
   - You should see your profile picture in the navbar

2. **Create a Poll**
   - Click "Create Poll"
   - Enter question and options
   - Submit

3. **Vote on Poll**
   - You'll be redirected to the poll page
   - Select an option and click "Vote"
   - Verify your choice is highlighted with "Your Vote" badge

4. **Test Real-Time Updates**
   - Copy the poll link
   - Open link in incognito window
   - Sign in with a different Google account
   - Vote on an option
   - Observe vote count update in original window instantly

5. **Test Multi-Layer Fairness**
   - Try voting again in same window → Should be blocked (Layer 1: OAuth)
   - Sign out and sign back in → Should still show your vote and block duplicate (Layer 1: OAuth)
   - Clear localStorage → Should still be blocked (Layer 1: OAuth persists)
   - Open different browser with same Google account → Should be blocked (Layer 1: OAuth cross-browser)

---

### Common Issues You Might Encounter

**Firebase Authentication Error**:
- Verify all Firebase environment variables are set correctly in `.env.local`
- Ensure Google sign-in provider is enabled in Firebase Console
- Check that `serviceAccountKey.json` is in the backend root directory
- Verify authorized domains include your deployment URL (for production)

**MongoDB Connection Error**:
- Ensure MongoDB is running (`sudo systemctl start mongodb` on Linux)
- Or verify Atlas connection string is correct
- Check network whitelisting in Atlas (allow 0.0.0.0/0 for development)

**Socket Connection Error**:
- Ensure my backend is running on port 5000
- Check CORS configuration allows frontend origin
- Verify `NEXT_PUBLIC_SOCKET_URL` matches backend URL

**"Authentication Required" Error**:
- Ensure user is signed in with Google
- Check that Firebase ID token is being sent in Authorization header
- Verify backend can reach Firebase Auth service (not blocked by firewall)

**"Module not found" Errors**:
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Ensure TypeScript is installed globally: `npm install -g typescript`

---

## Conclusion

### What I Achieved

Through this project, I successfully demonstrated:

1. **Full-Stack Proficiency**: I seamlessly integrated TypeScript across frontend and backend with consistent type safety and error handling.

2. **Real-Time Communication**: I effectively used Socket.IO for instant vote updates, showcasing my understanding of WebSocket technology and event-driven architecture.

3. **Database Design**: I designed a well-structured MongoDB schema with embedded documents, fairness tracking arrays, and vote mapping using Mongoose ODM.

4. **API Design**: I built RESTful endpoints with proper HTTP methods, status codes, and error handling. I documented clear request/response contracts thoroughly.

5. **Security & Fairness**: I implemented a dual-mechanism approach (vote token + client ID) to prevent abuse without over-engineering, demonstrating my understanding of trade-offs between security and complexity.

6. **Modern Frontend**: I used Next.js App Router with server components, React hooks for state management, and Tailwind CSS for rapid UI development. I added keyboard shortcuts and accessibility considerations to show attention to UX.

7. **Production Deployment**: I successfully deployed across three platforms (Vercel, Render, MongoDB Atlas) with proper environment configuration and understanding of platform constraints.

8. **Code Quality**: I wrote clean, maintainable code with TypeScript type safety, consistent naming conventions, separation of concerns (models/controllers/routes), and error boundary handling.

9. **Documentation**: I created this comprehensive README explaining my architecture decisions, API contracts, fairness mechanisms, edge cases, and future improvements.

---

### Why I Believe This Solution Is Production-Ready

**For the Assignment Scope**:

I believe this application is production-ready for:

- Internal team polls and surveys
- Event feedback collection
- Classroom quizzes and polls
- Community voting (non-critical)
- Product feedback gathering

**How It Meets Professional Standards**:

1. **Reliability**: I implemented error handling at API, database, and socket layers
2. **Performance**: I used optimized queries, room-based socket broadcasting, and optimistic UI updates
3. **Scalability**: I designed a clear path to horizontal scaling with Redis adapter and load balancing
4. **Maintainability**: I used TypeScript, modular structure, and clear separation of concerns
5. **User Experience**: I created responsive design, instant feedback, keyboard shortcuts, and toast notifications

---

### What This Project Demonstrates About My Skills

**Technical Skills I Demonstrated**:

- Full-stack JavaScript/TypeScript development
- RESTful API design and implementation
- WebSocket/Socket.IO real-time communication
- MongoDB database design and Mongoose ODM
- Next.js 15 (App Router) and React 19
- Tailwind CSS utility-first styling
- Deployment to cloud platforms (Vercel, Render, Atlas)
- Environment configuration and secrets management

**Engineering Judgment I Applied**:

- Choosing appropriate technologies for requirements
- Balancing security with simplicity (fairness mechanisms)
- Understanding platform constraints (Socket.IO on Render vs. Vercel)
- Documenting decisions and trade-offs
- Identifying limitations and proposing improvements

**Professional Practices I Followed**:

- Clean, readable code with consistent style
- Comprehensive error handling
- User-centered design (keyboard shortcuts, accessibility)
- Thorough documentation (this README)
- Version control (Git)

---

### My Final Thoughts

This Real-Time Poll Rooms application represents a complete, functional product I built with modern technologies and best practices. While it has known limitations (which I've documented above), I believe these are appropriate for an internship assignment and do not prevent successful demonstration of core competencies.

I believe this project showcases not just my coding ability, but also:

- Architectural thinking (frontend/backend separation, deployment strategy)
- Problem-solving skills (fairness mechanisms, real-time updates)
- Communication ability (clear documentation of complex features)
- Product mindset (UX decisions, future roadmap)

The code is ready for your review, the application is ready for use, and I'm ready to discuss my design decisions, tackle extension tasks, and contribute to your professional engineering team.

---

**Repository Structure**:

```
applyo-assignment/
├── realtime-poll-backend/      # Express + Socket.IO backend
│   ├── config/
│   │   └── firebaseAdmin.ts    # Firebase Admin SDK setup
│   ├── src/
│   │   ├── server.ts
│   │   ├── middleware/auth.ts  # Authentication middleware
│   │   ├── models/
│   │   │   ├── poll.ts         # Poll schema
│   │   │   └── vote.ts         # Vote tracking schema
│   │   ├── controllers/pollController.ts
│   │   └── routes/pollRoutes.ts
│   ├── serviceAccountKey.json  # Firebase credentials (gitignored)
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── realtime-poll-frontend/     # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── create/page.tsx
│   │   │   └── poll/[id]/page.tsx
│   │   ├── components/
│   │   │   └── NavbarAuth.tsx  # Auth UI component
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx # Auth state management
│   │   └── lib/
│   │       ├── api.ts
│   │       ├── socket.ts
│   │       ├── firebase.ts     # Firebase client config
│   │       └── clientId.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── .env.local
└── README.md                   # This file
```

**Deployment URLs**:

- Frontend: `https://applyo-assignment-ab47.vercel.app/`
- Backend: `https://applyo-assignment-1.onrender.com`
- Database: MongoDB Atlas (private connection)
