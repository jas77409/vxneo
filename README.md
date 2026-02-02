
# VXNEO Hybrid - Open Source Data Broker Opt-Out Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Open Source Love](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/ellerbrock/open-source-badges/)

## 🚀 Overview
VXNEO is an automated platform that helps individuals opt out from data broker websites. It uses web automation to submit removal requests on your behalf, saving you hours of manual work.

## ✨ Features
- **Automated Opt-Out**: Submits requests to multiple data brokers automatically
- **Modern Stack**: Built with SvelteKit, TailwindCSS, and Playwright
- **Secure Authentication**: Magic link login via Supabase
- **Proxy Rotation**: Built-in proxy support to avoid detection
- **CAPTCHA Handling**: Integrated CAPTCHA solving capabilities
- **Real-time Dashboard**: Monitor your opt-out progress
- **Production Ready**: PM2 cluster mode, logging, and monitoring
- **Docker Support**: Easy containerized deployment

## 🏗️ Architecture
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Frontend │───▶│ API │───▶│ Scraper │
│ (SvelteKit)│ │ (Node.js) │ │ (Playwright)│
└─────────────┘ └─────────────┘ └─────────────┘
│ │
┌──────▼──────┐ ┌─────▼──────┐
│ Database │ │ Proxy │
│ (Supabase) │ │ Rotation │
└─────────────┘ └────────────┘

text

## 🚦 Quick Start

### Prerequisites
- Node.js 18+ and npm
- [Supabase account](https://supabase.com) (free tier)
- Git

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/vxneo-hybrid.git
cd vxneo-hybrid

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
npm run dev
