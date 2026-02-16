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

#### Development Tools

- **ESLint**: Code quality and consistency
- **TypeScript Compiler**: Type checking and transpilation
- **Git**: Version control

---

## Backend Design

### How I Structured the Backend

```
realtime-poll-backend/
├── src/
│   ├── server.ts              # Entry point, Socket.IO setup
│   ├── models/
│   │   └── poll.ts            # Poll schema and model
│   ├── controllers/
│   │   └── pollController.ts  # Business logic
│   └── routes/
│       └── pollRoutes.ts      # API route definitions
├── package.json
├── tsconfig.json
└── .env
```

### How I Designed the Poll Schema

```typescript
interface IPoll {
    question: string;                    // The poll question
    options: IOption[];                  // Array of answer options
    votedTokens: string[];               // Vote tokens that have voted
    votedClients: string[];              // Client IDs that have voted
    votedIPs: string[];                  // IP addresses that have voted (PRIMARY)
    tokenVotes: Map<string, number>;     // Maps token/clientId/IP to vote choice
    timestamps: true;                    // createdAt, updatedAt
}

interface IOption {
    text: string;                        // Option display text
    votes: number;                       // Vote count
}
```

**My Design Decisions:**

1. **Options as Embedded Documents**: I stored options within the poll document rather than in a separate collection for simplicity and atomic updates

2. **Triple Fairness Arrays**: I included `votedIPs` (primary), `votedTokens` (secondary), and `votedClients` (tertiary) arrays to enable checking against three independent mechanisms

3. **Vote Mapping with Map**: I used the `tokenVotes` Map to store which option each token/clientId/IP voted for, enabling the "Your Vote" badge to persist across page refreshes, browser switches, and storage clearing

4. **IP-Based Primary Protection**: The `votedIPs` array provides the strongest protection against cross-browser and incognito mode voting

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
    "votedIPs": [],
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

**Description**: Retrieves poll data and determines if the requesting client has already voted.

**Headers** (optional):

```
x-vote-token: abc123def456      # Token from previous vote
x-client-id: uuid-client-id     # Browser-unique identifier
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
    "votedIPs": ["192.168.1.100", "10.0.0.5", ...],
    "tokenVotes": { "token1": 0, "client1": 1, "192.168.1.100": 0, ... },
    "createdAt": "2026-02-15T10:30:00.000Z",
    "updatedAt": "2026-02-15T11:45:00.000Z"
  },
  "userVotedOption": 1    # Index of option user voted for (null if not voted)
}
```

**Backend Logic**:

1. Extract client IP from request headers (X-Forwarded-For, X-Real-IP, or socket)
2. Check if IP exists in `poll.tokenVotes` Map (PRIMARY)
3. If found, return the vote index
4. Otherwise, check if `x-vote-token` header exists and is in `poll.tokenVotes` Map
5. If found, return the vote index
6. Otherwise, check if `x-client-id` header exists and is in `poll.tokenVotes` Map
7. Return vote index or `null`

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

**Description**: Records a vote on a specific option, enforces fairness checks, and broadcasts update via Socket.IO.

**Headers**:

```
x-vote-token: abc123def456      # Previous vote token (if exists)
x-client-id: uuid-client-id     # Browser client ID
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

1. **Extract Client IP**: Get IP from `X-Forwarded-For`, `X-Real-IP`, or `socket.remoteAddress` headers
2. **Check IP Address (PRIMARY)**: If IP exists in `votedIPs` array, reject with 403 "Already voted from this network"
3. **Check Vote Token**: If `x-vote-token` header exists and is in `votedTokens` array, reject with 403
4. **Check Client ID**: If `x-client-id` header exists and is in `votedClients` array, reject with 403
5. **Validate Option Index**: Check if `optionIndex` is within valid range
6. **Generate New Token**: Create a cryptographically secure random token (16 bytes)
7. **Increment Vote Count**: `poll.options[optionIndex].votes++`
8. **Record Fairness Data**:
   - Add IP to `votedIPs` array
   - Add new token to `votedTokens` array
   - Add clientId to `votedClients` array
   - Set `tokenVotes.set(clientIP, optionIndex)`
   - Set `tokenVotes.set(newToken, optionIndex)`
   - Set `tokenVotes.set(clientId, optionIndex)`
9. **Save to Database**: `await poll.save()`
10. **Broadcast Update**: `io.to(pollId).emit("voteUpdate", poll)`
11. **Return Response**: Include new vote token in response

**Error Responses**:

```json
// Already voted from this IP (Primary check)
{
  "success": false,
  "message": "Already voted from this network"
}

// Already voted by token
{
  "success": false,
  "message": "Already voted (Token)"
}

// Already voted by client ID
{
  "success": false,
  "message": "Already voted (Client)"
}

// Invalid option
{
  "success": false,
  "message": "Invalid option index"
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

This section explains the multi-layered approach to preventing vote manipulation while maintaining security appropriate for a production polling system.

### Why Fairness Matters

Without fairness mechanisms, a single user could:

- Vote multiple times by refreshing the page
- Skew results by submitting votes programmatically
- Manipulate outcomes in favor of specific options

For a polling application, even basic fairness is essential to maintain data integrity and user trust.

### Mechanism 1: Vote Token (Server-Issued)

**How It Works**:

1. **Generation**: After a successful vote, the backend generates a cryptographically secure random token using `crypto.randomBytes(32).toString('hex')`

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
const newToken = crypto.randomBytes(32).toString('hex');

// Check for duplicate
if (voteToken && poll.votedTokens.includes(voteToken)) {
    return res.status(400).json({
        success: false,
        message: "Already voted on this poll"
    });
}

// Store token
poll.votedTokens.push(newToken);
poll.tokenVotes.set(newToken, optionIndex);
```

**Code Example** (Frontend):

```typescript
// Store token after voting
localStorage.setItem("voteToken", res.data.voteToken);

// Send token with future requests
api.get(`/polls/${id}`, {
    headers: {
        "x-vote-token": localStorage.getItem("voteToken")
    }
});
```

**Strengths**:

- Server-controlled: Cannot be forged or predicted
- Session-persistent: Survives page refreshes
- Simple to implement and understand
- Cryptographically secure randomness

**Limitations**:

- Cleared if user clears browser storage
- Not shared across browsers or devices
- No protection against incognito mode

---

### Mechanism 2: Client ID (Browser-Based)

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
// clientId.ts utility
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
    { headers: { "x-client-id": clientId } }
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

- Browser-unique: Different from vote token, adds second layer
- Persistent: Survives across sessions and polls
- Lightweight: No server-side session management
- Complements vote token mechanism

**Limitations**:

- Client-generated: User could theoretically modify code to generate new IDs
- Storage-dependent: Cleared with `localStorage`
- Not shared across browsers

---

### Mechanism 3: IP Address (Primary Fairness Layer)

**How It Works**:

1. **Extraction**: The backend extracts the client's IP address from the request:
   ```typescript
   const clientIP = (
       req.headers["x-forwarded-for"] as string ||
       req.headers["x-real-ip"] as string ||
       req.socket.remoteAddress ||
       ""
   ).split(',')[0].trim();
   ```

2. **Priority Checking**: IP-based checking happens FIRST, before token or clientId verification
   - This is the **primary** fairness mechanism
   - Prevents cross-browser voting from the same network

3. **Storage**: The IP address is:
   - Added to the `votedIPs` array in the database
   - Stored in the `tokenVotes` Map with the option index
   - Persisted permanently for the lifetime of the poll

4. **Verification**: On all vote attempts, the backend:
   - Extracts the IP address from request headers
   - Checks if it exists in `poll.votedIPs` array
   - Rejects the vote immediately if found with message: "Already voted from this network"

5. **Vote Tracking**: The IP is stored in `tokenVotes` Map, enabling the "Your Vote" badge to persist even when:
   - Switching browsers (Chrome → Edge → Firefox)
   - Clearing localStorage/cookies
   - Using incognito mode
   - Different devices on the same network

**Code Example** (Backend):

```typescript
// Extract client IP (handles proxies and load balancers)
const clientIP = (
    req.headers["x-forwarded-for"] as string ||
    req.headers["x-real-ip"] as string ||
    req.socket.remoteAddress ||
    ""
).split(',')[0].trim();

// PRIMARY FAIRNESS CHECK - Happens before token/clientId
if (clientIP && poll.votedIPs && poll.votedIPs.includes(clientIP)) {
    return res.status(403).json({
        success: false,
        message: "Already voted from this network"
    });
}

// Record the IP address
if (clientIP) {
    if (!poll.votedIPs) {
        poll.votedIPs = [];
    }
    poll.votedIPs.push(clientIP);
    poll.tokenVotes.set(clientIP, optionIndex);
}
```

**Code Example** (Frontend - Automatic):

```typescript
// No frontend code needed - IP is automatically extracted by backend
// The frontend simply makes the vote request:
api.post(`/polls/${id}/vote`, { optionIndex }, {
    headers: {
        "x-vote-token": localStorage.getItem("voteToken"),
        "x-client-id": getClientId()
    }
});
```

**Why IP-Based Is Now PRIMARY**:

The original implementation avoided IP-based voting due to concerns about shared networks and privacy. However, after evaluation, I implemented it as the **primary mechanism** because:

1. **Cross-Browser Protection**: The main vulnerability was users voting from Chrome, then Edge, then Firefox on the same device. IP-based tracking solves this completely.

2. **Proxy Header Support**: Modern deployment platforms (Render, Heroku, Vercel) properly pass IP addresses via `X-Forwarded-For` headers, making IP extraction reliable.

3. **Network-Level Fairness**: For most use cases (home users, individual offices), one vote per network is the desired behavior.

4. **Enhanced Security**: Combined with token and clientId, it creates a robust three-layer defense.

**Strengths**:

- **Browser-agnostic**: Works across Chrome, Edge, Firefox, Safari, etc.
- **Storage-independent**: Cannot be bypassed by clearing localStorage/cookies
- **Incognito-proof**: Works even in private/incognito browsing modes
- **Device-independent**: Same network = same IP = one vote (desired behavior)
- **Automatic**: No frontend code or user action required
- **Server-controlled**: Cannot be manipulated by client-side code

**Limitations & Trade-offs**:

- **Shared Networks**: Multiple legitimate users on same WiFi (office, family) share one IP
  - *Mitigation*: For corporate/classroom use, this is often the desired behavior (one vote per location)
  - *Alternative*: Users can use mobile data to vote from different IP

- **Dynamic IPs**: Mobile networks may assign different IPs
  - *Impact*: Minimal - most users complete voting in one session
  - *Note*: Token and clientId still provide secondary protection

- **VPN/Proxy**: Can be bypassed using VPN services
  - *Reality*: This requires deliberate effort and technical knowledge
  - *Acceptable*: Perfect security requires authentication (out of scope)

- **Privacy**: IP addresses are considered personal data under GDPR
  - *Mitigation*: IP addresses are not displayed, only stored for vote verification
  - *Compliance*: For production, add privacy policy and data retention limits

**Why This Trade-off Is Worth It**:

The IP-based approach solves the **#1 reported issue**: casual users voting multiple times by switching browsers. While it has limitations (shared networks, VPNs), these require deliberate action or specific circumstances, making them acceptable trade-offs for a polling application that prioritizes:

1. Simplicity (no login required)
2. Real-time updates (primary feature)
3. Reasonable fairness (not perfect security)

---

### How My Three Mechanisms Work Together

**Layered Defense Strategy**:

**Layered Defense Strategy**:

```
Vote Attempt Flow:
┌──────────────────────┐
│ User clicks option   │
└──────────┬───────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Frontend sends:                         │
│  - optionIndex in body                  │
│  - x-vote-token header (if exists)      │
│  - x-client-id header (always)          │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Backend checks (in order):              │
│                                         │
│  1. Is clientIP in votedIPs[]?          │
│     ├─ Yes → Reject (403) ⛔           │
│     └─ No → Continue                    │
│                                         │
│  2. Is voteToken in votedTokens[]?      │
│     ├─ Yes → Reject (403) ⛔           │
│     └─ No → Continue                    │
│                                         │
│  3. Is clientId in votedClients[]?      │
│     ├─ Yes → Reject (403) ⛔           │
│     └─ No → Continue ✅                 │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Record vote:                            │
│  - Increment option votes               │
│  - Generate new token                   │
│  - Add IP to votedIPs[]                 │
│  - Add token to votedTokens[]           │
│  - Add clientId to votedClients[]       │
│  - Store all three in tokenVotes Map    │
│  - Save to database                     │
│  - Emit Socket.IO update                │
│  - Return new token to client           │
└─────────────────────────────────────────┘
```

**Example Scenarios**:

**Scenario 1: Fresh User**
1. **User A** votes on Poll X from Chrome
   - IP: `192.168.1.100` → Recorded
   - `voteToken1` generated and stored
   - `clientId1` recorded
   - ✅ Vote accepted

**Scenario 2: Page Refresh (Same Browser)**
2. **User A** refreshes page and tries to vote again
   - IP: `192.168.1.100` → Found in `votedIPs[]`
   - ⛔ **Rejected immediately** with "Already voted from this network"
   - (Token and clientId checks never reached)

**Scenario 3: Different Browser (Same Device)** 🔒 **NOW BLOCKED**
3. **User A** opens Edge and tries to vote
   - IP: `192.168.1.100` → Found in `votedIPs[]`
   - ⛔ **Rejected immediately** with "Already voted from this network"
   - ✨ **This is the key improvement** - solves the cross-browser issue

**Scenario 4: Clear Storage (Same Network)**
4. **User A** clears localStorage and tries again
   - IP: `192.168.1.100` → Found in `votedIPs[]`
   - ⛔ **Rejected immediately**
   - Storage clearing has no effect

**Scenario 5: Incognito Mode (Same Network)**
5. **User A** uses incognito/private browsing
   - IP: `192.168.1.100` → Found in `votedIPs[]`
   - ⛔ **Rejected immediately**
   - Incognito mode cannot bypass IP check

**Scenario 6: Different User (Same Network)**
6. **User B** votes from same WiFi network
   - IP: `192.168.1.100` → Found in `votedIPs[]`
   - ⛔ **Rejected** - shares IP with User A
   - **Trade-off**: Family/office members must use mobile data or accept one vote per location

**Scenario 7: Different Network (Same User)**
7. **User A** switches to mobile data
   - IP: `10.20.30.40` (new IP) → Not in `votedIPs[]`
   - ⚠️ Could vote again (limitation)
   - **Acceptable**: Requires deliberate action and network change

**Result**: The three-layer system provides strong protection against casual duplicate voting while maintaining simplicity (no login required).

---

### Threat Model & What I Mitigated

| Threat | Mitigated? | How |
|--------|-----------|-----|
| Accidental double-click | ✅ Yes | Button disabled after vote + frontend state |
| Page refresh | ✅ Yes | IP + vote token + clientId all persist |
| **Multiple browsers (same device)** | **✅ Yes** | **IP-based tracking blocks cross-browser voting** |
| **Incognito mode (same network)** | **✅ Yes** | **IP address is checked regardless of browser mode** |
| **Clearing localStorage** | **✅ Yes** | **IP-based check is independent of browser storage** |
| Multiple devices (same network) | ⚠️ Expected | One vote per network/household (design choice) |
| Multiple networks (VPN/mobile switch) | ⚠️ Partial | Requires deliberate network change |
| Automated bot voting | ⚠️ Partial | Would need unique IPs + clientIds per request |
| Developer tools manipulation | ❌ No | Advanced users can modify frontend code |
| Distributed bot networks | ❌ No | Would require IP rate limiting / CAPTCHA |

**Understanding the Symbols**:
- ✅ **Yes** = Successfully mitigated with the three-layer approach
- ⚠️ **Partial/Expected** = Limited protection or by design
- ❌ **No** = Requires additional infrastructure (rate limiting, auth, CAPTCHA)

**Key Improvements with IP-Based Voting**:

The addition of IP-based tracking as the primary mechanism significantly improved protection against:

1. **Cross-Browser Voting** ✅ → Previous major vulnerability, now solved
2. **Incognito Mode** ✅ → Previously could bypass, now blocked  
3. **Storage Clearing** ✅ → Previously could bypass, now blocked

**Remaining Limitations Explained**:

- **Multiple networks**: A determined user can switch from WiFi to mobile data to vote again
  - *Trade-off*: Requires deliberate action and is acceptable for this use case
  - *Solution path*: Would require user authentication to fully prevent

- **Distributed bots**: Sophisticated attackers with multiple IP addresses could bypass
  - *Trade-off*: This is an advanced attack requiring significant resources
  - *Solution path*: Would require rate limiting, CAPTCHA, or behavioral analysis

- **Developer tools**: Users can modify frontend code
  - *Reality*: Backend validation prevents actual vote manipulation
  - *Impact*: They can only break their own UI experience

**Why This Level of Protection Is Appropriate**:

This three-layer approach provides **strong protection against casual abuse** (the 99% case) while accepting that **determined attackers** with technical skills (the 1% case) could potentially bypass these measures. For a polling application that prioritizes:

1. 🎯 **Simplicity** - No login/registration required
2. ⚡ **Real-time updates** - Primary feature showcase  
3. 🛡️ **Reasonable fairness** - Not bank-level security

This represents an excellent balance between security and usability.

---

### Why I Believe This Approach Is Appropriate

**For Production Polling Systems**:

1. **Solves Real Problems**: The IP-based layer directly addresses the cross-browser voting issue that users actually encounter

2. **Layered Defense**: Three independent mechanisms (IP + token + clientId) create redundancy and catch different abuse patterns

3. **Server-Controlled**: Primary mechanism (IP) cannot be manipulated by client-side code

4. **No Authentication Required**: Maintains low friction - users can vote immediately without signup

5. **Transparent Trade-offs**: Clear documentation of what is and isn't protected

**Evolution of the Design**:

- **V1**: Token + ClientId (browser-based) → Vulnerable to cross-browser voting
- **V2**: Added IP as primary → Solved cross-browser, incognito, and storage-clearing issues
- **Result**: Significantly stronger protection while maintaining simplicity

**What This System IS Suitable For**:

- ✅ Internal team polls  
- ✅ Classroom surveys and feedback
- ✅ Community polls and voting
- ✅ Product feedback forms
- ✅ Event voting (best talk, favorite feature)
- ✅ Public opinion polls (with moderate stakes)
- ✅ Social media integrations
- ✅ Newsletter/blog audience engagement

**What This System Is NOT Suitable For**:

- ❌ High-stakes voting (elections, contests with prizes)
- ❌ Financial transactions or legally binding votes
- ❌ Regulated industries requiring complete audit trails
- ❌ Situations where VPN users need individual representation
- ❌ Large offices where many employees should vote individually

**If I Had More Time / Production Requirements**:

To make this bulletproof for high-stakes scenarios, I would add:

1. **User Authentication**: Login system with email verification
2. **Rate Limiting**: Prevent bot attacks by limiting requests per IP/time window
3. **CAPTCHA**: Human verification for suspicious patterns
4. **Behavioral Analysis**: Track voting patterns and flag anomalies
5. **Audit Logging**: Complete trail of all vote attempts (successful and failed)
6. **IP Reputation**: Check against known VPN/proxy IP databases
7. **Device Fingerprinting**: Canvas fingerprinting, WebGL, audio context
8. **Two-Factor Verification**: SMS or email confirmation for critical polls

However, these add significant complexity, friction, and cost - which would defeat the purpose of a **simple, real-time, anonymous polling system**.

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

### 1. No Authentication System

**Limitation**: Anyone with the poll link can vote. No user accounts or profiles.

**Impact**:

- Cannot identify voters by name or email
- Cannot implement features like "edit your vote" or "view your voting history"
- Cannot restrict polls to specific user groups

**Rationale**: The assignment scope focused on real-time functionality, not user management.

**How I Mitigate This**: My three-layer fairness system (IP address + token + clientId) provides strong abuse prevention against cross-browser voting.

---

### 2. LocalStorage Dependency (Partially Mitigated)

**Limitation**: Vote tokens and client IDs are stored in browser's localStorage.

**Previous Impact** (Now Resolved with IP Tracking):

- ✅ ~~Clearing browser data removes voting record~~ → **Now blocked by IP check**
- ✅ ~~Incognito mode creates fresh storage each session~~ → **Now blocked by IP check**
- ⚠️ No persistence across devices on different networks

**Current Status**: With IP-based tracking as the primary mechanism, localStorage is now a secondary/tertiary layer. Users can clear storage or use incognito, but they'll still be blocked by their IP address.

**Remaining Limitation**: Users on different devices with different IP addresses (e.g., home WiFi vs. mobile data) could potentially vote multiple times. This requires deliberate network switching and is considered acceptable for this application's security model.

**Why I Didn't Use Cookies**: Cookies would face similar limitations and add complexity with CORS and security flags.

**Why I Didn't Use Server Sessions**: Would require authentication system and add complexity beyond assignment scope.

---

### 3. Client-Generated IDs (Mitigated by IP Tracking)

**Limitation**: Client ID is generated on the frontend, so technically a user could modify code to generate new IDs.

**Previous Impact**: Determined users could bypass clientId check with developer tools.

**Current Status**: With IP-based tracking as the primary mechanism, manipulating the client ID no longer allows bypassing vote restrictions. The IP check happens first and cannot be circumvented by client-side code changes.

**Rationale**: The three-layer approach provides defense in depth - even if one layer is compromised, the others provide protection. IP-based tracking is the strongest layer as it's entirely server-controlled.

---

### 4. Shared Network Limitation (Trade-off of IP-Based Fairness)

**Limitation**: IP-based vote tracking treats all users on the same network as a single voter.

**Impact**:

- Family members on home WiFi can only vote once total (not once each)
- Office/workplace with shared internet allows only one vote per location
- University campus networks restrict to one vote across all students
- Public WiFi (coffee shops, libraries) allows only one vote per location

**Why This Exists**: IP addresses identify networks, not individual users. Multiple devices on the same WiFi share the same public IP address visible to the server.

**Workarounds for Users**:

- Switch to mobile data (different IP address)
- Use different networks (home vs. work vs. mobile)
- Share one vote per household/location (often acceptable for polls)

**When This Is Actually Desirable**:

- Household opinion polls (one vote per family)
- Office/team votes (one vote per location/department)
- Regional surveys (one vote per area)

**When This Is Problematic**:

- Large corporations with hundreds of employees on same network
- University campuses with thousands of students
- Public venues where independent voters share WiFi

**Design Decision**: For this application, I chose network-level fairness as the primary protection because:
1. It solves the major issue (cross-browser voting) that pure localStorage couldn't  
2. For most use cases (home users, small teams), one vote per network is acceptable
3. Users who need to vote individually can use mobile data
4. The alternative (no IP checking) had worse vulnerabilities

**Future Enhancement**: Could add an optional "strict mode" flag when creating polls:
- `strictMode: false` (default) → Network-based fairness (current behavior)  
- `strictMode: true` → Requires user authentication for individual voting

---

### 5. No Poll Expiration

**Limitation**: Polls remain active indefinitely. No time limits or closing mechanism.

**Impact**:

- Old polls accumulate in database
- No way to "lock" results after a certain date
- Could lead to storage costs over time

**What I Could Add**: Optional expiration date field, countdown timer display, and locked voting after expiration.

---

### 6. No Poll Editing or Deletion

**Limitation**: Once a poll is created, the question and options cannot be changed or deleted.

**Impact**:

- Typos are permanent
- Abandoned polls clutter database
- No admin controls

**Workaround**: Create a new poll with corrected content.

**What I Could Add**: Implement edit functionality (only before votes are cast) and delete button with confirmation.

---

### 7. Scalability Constraints

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

### 8. No Analytics or Insights

**Limitation**: No tracking of poll views, vote timestamps, or demographic data.

**Impact**: Cannot answer questions like "how many people viewed but didn't vote?" or "when did voting spike?"

**What I Could Add**: Track events like poll opens, vote submissions (with timestamps), and share button clicks.

---

### 9. Limited Abuse Detection (Improved with IP Tracking)

**Current Protection**: Three-layer fairness system (IP + vote token + client ID) significantly reduces abuse.

**Remaining Limitations**:

- No rate limiting on poll creation (automated scripts could create many polls)
- No CAPTCHA verification (though IP tracking makes mass voting impractical)
- No anomaly detection (sudden vote spikes aren't flagged)

**What IP-Based Protection Solved**:

- ✅ Cross-browser vote spam → Blocked by IP check
- ✅ Incognito mode abuse → Blocked by IP check
- ✅ Storage-clearing attacks → Blocked by IP check
- ⚠️ Bot voting → Now requires unique IPs (much harder)

**Remaining Bot Concerns**:

- Distributed bots with multiple IPs could still vote (would need VPN/proxy network)
- Poll creation spam (would need rate limiting on `/api/polls` endpoint)

**What Production Would Add**:

- Rate limiting per IP on both voting AND poll creation (e.g., 10 actions per hour)
- CAPTCHA on vote submission for suspicious patterns
- Anomaly detection (flag polls with sudden vote spikes from diverse IPs)
- IP reputation checking (block known VPN/proxy services if required)

---

### 10. No Mobile App

**Limitation**: Web-only application. No native iOS or Android apps.

**Impact**: Experience depends on mobile browser quality.

**How I Mitigate This**: Fully responsive design ensures good mobile web experience.

**What I Could Add**: React Native app using same backend APIs.

---

### 11. Single Language Support

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

1. **Authentication System**
   - I would implement user registration and login (email + password)
   - Google/GitHub OAuth integration
   - User dashboard showing created polls
   - Vote history and analytics

2. **Poll Editing**
   - I would allow editing question/options before first vote
   - Lock editing after votes are cast
   - Show edit history (audit log)

3. **Advanced Fairness**
   - I would add browser fingerprinting (Canvas, WebGL, fonts)
   - IP-based rate limiting (with proxy detection)
   - CAPTCHA on vote submission
   - Machine learning-based anomaly detection

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

3. **Create Environment File**
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

4. **Start Development Server**
   ```bash
   npm run dev
   # or for production build:
   npm run build
   npm start
   ```

5. **Verify Server Running**
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

3. **Create Environment File**
   ```bash
   # Create .env.local file
   touch .env.local
   ```

   Add the following:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api/polls
   NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Open Application**
   - Navigate to `http://localhost:3000`
   - You should see the homepage

---

### How to Test the Full Stack

1. **Create a Poll**
   - Click "Create Poll"
   - Enter question and options
   - Submit

2. **Vote on Poll**
   - Share button → Copy link
   - Open link in incognito window
   - Vote on an option

3. **Verify Real-Time Updates**
   - Keep both windows open
   - Vote in one window
   - Observe vote count update in other window instantly

---

### Common Issues You Might Encounter

**MongoDB Connection Error**:
- Ensure MongoDB is running (`sudo systemctl start mongodb` on Linux)
- Or verify Atlas connection string is correct
- Check network whitelisting in Atlas (allow 0.0.0.0/0 for development)

**Socket Connection Error**:
- Ensure my backend is running on port 5000
- Check CORS configuration allows frontend origin
- Verify `NEXT_PUBLIC_SOCKET_URL` matches backend URL

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

5. **Security & Fairness**: I implemented a three-layer fairness system (IP address + vote token + client ID) to prevent cross-browser voting and abuse, demonstrating my understanding of trade-offs between security, user privacy, and system complexity.

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
│   ├── src/
│   │   ├── server.ts
│   │   ├── models/poll.ts
│   │   ├── controllers/pollController.ts
│   │   └── routes/pollRoutes.ts
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
│   │   └── lib/
│   │       ├── api.ts
│   │       ├── socket.ts
│   │       └── clientId.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── .env.local
└── README.md                   # This file
```

**Deployment URLs**:

- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-backend.onrender.com`
- Database: MongoDB Atlas (private connection)
