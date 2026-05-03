#!/bin/bash
# ============================================================
# DecentraVote - Quick Start Script
# Decentralized E-Voting System
# SRM Valliammai Engineering College - MCA Section 2
# ============================================================

echo ""
echo "🗳️  =============================================="
echo "   DECENTRALIZED E-VOTING SYSTEM"
echo "   SRM Valliammai Engineering College"
echo "   MCA Section 2 | Batch 2025-2027"
echo "=================================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Please install Node.js v18+ from https://nodejs.org"
  exit 1
fi

echo "✅ Node.js: $(node -v)"
echo ""

# Install dependencies
echo "📦 Installing server dependencies..."
npm install

echo "📦 Installing client dependencies..."
cd client && npm install && cd ..

echo ""
echo "✅ Dependencies installed!"
echo ""
echo "📋 Next steps:"
echo ""
echo "  1. Start MongoDB:"
echo "     mongod"
echo ""
echo "  2. Start Ganache (local blockchain):"
echo "     npx ganache --port 7545 --networkId 1337"
echo ""
echo "  3. Deploy smart contract:"
echo "     npm run compile && npm run migrate"
echo ""
echo "  4. Seed admin users:"
echo "     npm run seed"
echo ""
echo "  5. Start backend:"
echo "     npm run dev"
echo ""
echo "  6. Start frontend (new terminal):"
echo "     cd client && npm start"
echo ""
echo "  7. Open: http://localhost:3000"
echo ""
echo "  Admin 1: admin / Admin@123"
echo "  Admin 2: admin2 / Admin@456"
echo ""
echo "🎉 Setup complete! Follow the steps above."
