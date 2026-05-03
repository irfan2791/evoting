# 🗳️ Decentralized E-Voting System
### Blockchain-Powered | SHA-256 Secured | Smart Contracts
**SRM Valliammai Engineering College — Department of Computer Applications**
**MC4268 Mini Project | Batch: 2025–2027 | MCA SECTION-1**
**Student: Mohamed Irfan S | Register: 7422562I053**

---

## 📋 Project Overview

A fully decentralized electronic voting system built on Ethereum blockchain with Solidity smart contracts, ensuring transparent, secure, and immutable voting using SHA-256 hashing and the Ethereum Virtual Machine (EVM).

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js, Recharts, Framer Motion |
| Backend | Node.js, Express.js |
| Database | MongoDB (off-chain data) |
| Blockchain | Ethereum (Ganache local network) |
| Smart Contracts | Solidity 0.8.19 |
| Dev Framework | Hardhat / Truffle |
| Wallet | MetaMask |
| Web3 Library | Web3.js / Ethers.js |
| Hash Algorithm | SHA-256 (immutable votes) |
| Runtime | Ethereum Virtual Machine (EVM) |
| Authentication | JWT (JSON Web Tokens) |
| Tools | VS Code, Ganache, Web3.js |

---

## 👥 User Roles

### Admin (2 default accounts)
| Username | Password |
|----------|----------|
| `admin` | `Admin@123` |
| `admin2` | `Admin@456` |

**Admin can:**
- Login to admin dashboard
- View all registered voters
- Approve / Reject voter registrations
- Create and manage elections
- Add candidates to elections
- View live voting results
- Publish official election results

### Voter
**Voter can:**
- Register with personal details
- Login (after admin approval)
- Browse active elections
- Cast vote (MetaMask + blockchain)
- View results (after voting)
- Verify vote using SHA-256 hash
- View voting history

---

## ⚙️ Setup Instructions

### Prerequisites
Make sure you have these installed:
- **Node.js** v18+ — https://nodejs.org
- **MongoDB** — https://www.mongodb.com/try/download/community
- **MetaMask** browser extension — https://metamask.io
- **Ganache** (optional GUI) — https://trufflesuite.com/ganache/

---

### Step 1: Clone & Install Dependencies

```bash
# Clone the project
cd decentralized-evoting-system

# Install root dependencies (backend + blockchain tools)
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

---

### Step 2: Start MongoDB

```bash
# macOS / Linux
mongod

# Windows (as service)
net start MongoDB

# Or using MongoDB Atlas (cloud) — update MONGODB_URI in .env
```

---

### Step 3: Start Ganache (Local Blockchain)

**Option A: CLI (Recommended)**
```bash
# In a new terminal
npx ganache --port 7545 --networkId 1337 --deterministic
```

**Option B: Ganache GUI**
- Open Ganache application
- Create new workspace
- Set Port: 7545, Network ID: 1337
- Start the workspace

Copy the first account's private key — you'll need it to configure MetaMask.

---

### Step 4: Configure MetaMask

1. Open MetaMask browser extension
2. Add a new network:
   - **Network Name:** Ganache Local
   - **RPC URL:** http://127.0.0.1:7545
   - **Chain ID:** 1337
   - **Currency Symbol:** ETH
3. Import an account using private key from Ganache
4. You should see 100 ETH (test funds)

---

### Step 5: Compile & Deploy Smart Contract

```bash
# Compile Solidity contracts
npm run compile

# Deploy to local Ganache network
npm run migrate
```

This will:
- Deploy the `DecentralizedEVoting.sol` contract
- Save contract address to `server/config/contract.json`
- Save ABI to `client/src/contracts/DecentralizedEVoting.json`
- Create a sample election with 4 candidates

---

### Step 6: Seed Admin Users

```bash
npm run seed
```

This creates:
- Admin 1: `admin` / `Admin@123`
- Admin 2: `admin2` / `Admin@456`
- Sample election: "MCA Student Council Election 2026"

---

### Step 7: Start the Application

**Terminal 1 — Backend Server:**
```bash
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd client
npm start
# Opens http://localhost:3000
```

**Terminal 3 — Ganache (if not already running):**
```bash
npx ganache --port 7545 --networkId 1337
```

---

## 🌐 Application URLs

| Service | URL |
|---------|-----|
| Frontend (React) | http://localhost:3000 |
| Backend API | http://localhost:5000/api |
| API Health Check | http://localhost:5000/api/health |
| Blockchain RPC | http://127.0.0.1:7545 |

---

## 📁 Project Structure

```
decentralized-evoting-system/
├── contracts/
│   └── DecentralizedEVoting.sol    # Solidity smart contract
├── scripts/
│   └── deploy.js                   # Hardhat deployment script
├── server/
│   ├── index.js                    # Express.js main server
│   ├── models/
│   │   ├── User.js                 # MongoDB User model
│   │   └── Election.js             # MongoDB Election model
│   ├── routes/
│   │   ├── auth.js                 # Authentication routes
│   │   ├── admin.js                # Admin routes
│   │   └── elections.js            # Election & voting routes
│   ├── middleware/
│   │   └── auth.js                 # JWT middleware
│   ├── config/
│   │   └── contract.json           # Deployed contract info
│   └── scripts/
│       └── seedAdmin.js            # Admin seeder
├── client/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js                  # Main router
│       ├── index.js                # Entry point
│       ├── styles/
│       │   └── global.css          # Global styles
│       ├── utils/
│       │   ├── api.js              # Axios API client
│       │   └── AuthContext.js      # Auth state management
│       ├── components/
│       │   └── Sidebar.js          # Navigation sidebar
│       └── pages/
│           ├── Login.js            # Login page
│           ├── Register.js         # Registration page
│           ├── VoterDashboard.js   # Voter home
│           ├── AdminDashboard.js   # Admin home
│           ├── AdminUsers.js       # User management
│           ├── AdminElections.js   # Election management
│           ├── AdminResults.js     # Admin results view
│           ├── Elections.js        # Browse elections
│           ├── VotePage.js         # Cast vote (blockchain)
│           ├── Results.js          # Detailed results + charts
│           ├── ResultsOverview.js  # All results overview
│           ├── Profile.js          # Voter profile
│           ├── MyVotes.js          # Voting history
│           ├── BlockchainInfo.js   # Blockchain details
│           └── VerifyVote.js       # Hash verifier
├── hardhat.config.js               # Hardhat configuration
├── package.json
└── .env                            # Environment variables
```

---

## 🔒 Security Features

| Feature | Implementation |
|---------|----------------|
| Vote Hashing | SHA-256 (CryptoJS + keccak256 on-chain) |
| Immutable Votes | Blockchain smart contract storage |
| Authentication | JWT tokens (24h expiry) |
| Password Storage | bcrypt (12 rounds) |
| Double Vote Prevention | On-chain mapping + off-chain check |
| Rate Limiting | express-rate-limit (100 req/15min) |
| Input Sanitization | Mongoose validators |
| Secure Headers | Helmet.js |
| Voter Privacy | Voter ID hashed before storing |

---

## 📜 Smart Contract Functions

### Admin Functions
- `createElection(title, description, startTime, endTime)` — Create a new election
- `addCandidate(electionId, name, party, symbol)` — Add candidate to election
- `toggleElectionStatus(electionId)` — Enable/disable election
- `publishResults(electionId)` — Officially publish results

### Voter Functions
- `castVote(electionId, candidateId, voterIdHash)` — Cast encrypted vote

### View Functions
- `getElectionCandidates(electionId)` — Get all candidates
- `getAllElections()` — List all elections
- `hasVoted(voter, electionId)` — Check if voted
- `verifyVote(voteHash)` — Verify vote existence
- `getWinner(electionId)` — Get winning candidate

---

## 🎓 Internal Guide

**Guide:** M. Asn Nainar
**Designation:** Assistant Professor (S.G.)
**Contact:** 944 445 6074
**Email:** asanm.lit@srmvalliammai.ac.in

---

## ⚠️ Important Notes

1. Change admin passwords after first login!
2. This is a development/demo setup — for production, use a real Ethereum network (Mainnet/Polygon)
3. Ganache must be running for blockchain features to work
4. MetaMask is optional — voting still works without it (off-chain recording)

---

*MC4268-MINI PROJECT REGISTRATION FORM | Class: MCA SECTION-1 | Batch: 2025-2027*
*SRM VALLIAMMAI ENGINEERING COLLEGE, SRM NAGAR, KATTANKULATHUR - 603 203*
