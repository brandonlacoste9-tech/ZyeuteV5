# ✅ Tuesday Demo Checklist

## 🕐 24 HOURS BEFORE (Monday Evening)

- [ ] Run Sunday staging drill: `npm run test:bounty`
- [ ] Verify all 3 tests pass (Wallet, Jackpot, Trading)
- [ ] Check Guardian Bee is running: `npm run guardian:windows`
- [ ] Test kill-switch demo (stop Docker, watch recovery)
- [ ] Verify Grafana dashboard is accessible and showing data
- [ ] Test Slack webhook (send test alert)
- [ ] Review Tuesday demo script
- [ ] Prepare backup screenshots (in case live demo fails)

---

## 🕐 2 HOURS BEFORE (Tuesday Morning)

- [ ] **Infrastructure Check:**
  - [ ] Guardian Bee running and healthy
  - [ ] Docker containers up: `docker ps`
  - [ ] Health endpoint responding: `curl http://localhost:8080/api/health`
  - [ ] Metrics endpoint responding: `curl http://localhost:8080/api/metrics`
  - [ ] Grafana dashboard loaded and visible

- [ ] **Economy Check:**
  - [ ] Wallet created for test user
  - [ ] Jackpot pool exists (create if needed)
  - [ ] At least 1 bee listing in marketplace
  - [ ] Transaction history visible (optional)

- [ ] **Environment Variables:**
  - [ ] `QUEEN_HMAC_SECRET` is set
  - [ ] `GUARDIAN_WEBHOOK` is configured (if using)
  - [ ] `SLACK_WEBHOOK` is configured (if using)

- [ ] **Presentation Prep:**
  - [ ] Grafana dashboard on main screen (full screen)
  - [ ] Terminal open and ready (for kill-switch demo)
  - [ ] Docker commands ready (copy-paste friendly)
  - [ ] Demo script printed or on second screen

---

## 🕐 30 MINUTES BEFORE

- [ ] **Final Verification:**
  - [ ] Run quick health check: `curl http://localhost:8080/api/health`
  - [ ] Verify metrics are updating: Check Grafana panels
  - [ ] Test wallet endpoint: `curl http://localhost:8080/api/economy/wallet`
  - [ ] Test jackpot endpoint: `curl http://localhost:8080/api/economy/jackpot/status`

- [ ] **Kill-Switch Test (Dry Run):**
  - [ ] Note backend container ID: `docker ps | grep backend`
  - [ ] Test stop command: `docker stop <container-id>` (then restart immediately)
  - [ ] Verify Guardian Bee detects and recovers
  - [ ] Restore container if needed

- [ ] **Screen Setup:**
  - [ ] Primary screen: Grafana dashboard (full screen)
  - [ ] Secondary screen: Terminal + demo script (split view)
  - [ ] Test screen sharing (if remote)
  - [ ] Audio/video test (if remote)

---

## 🕐 5 MINUTES BEFORE

- [ ] **Last-Minute Checks:**
  - [ ] All services running: `docker ps` shows all containers
  - [ ] Health status is green in Grafana
  - [ ] Self-heal counter is at baseline (remember the number)
  - [ ] Wallet, Jackpot, Trading endpoints all responding
  - [ ] Demo script open and ready
  - [ ] Water/snacks nearby (stay hydrated!)

- [ ] **Mental Prep:**
  - [ ] Review key talking points (from demo script)
  - [ ] Remember the "why" behind each feature
  - [ ] Prepare to answer questions confidently
  - [ ] Take a deep breath—you've got this!

---

## 🕐 DURING THE DEMO

### **Before You Start:**
- [ ] Take a screenshot of Grafana dashboard (baseline state)
- [ ] Note the current "Self-Heal Events" counter value
- [ ] Verify you can see both Grafana and terminal on your screen

### **During Kill-Switch Demo:**
- [ ] **Before stopping container:** Say "Watch the dashboard"
- [ ] **Stop container:** `docker stop <container-id>`
- [ ] **Wait 60 seconds:** Let the audience see the failure
- [ ] **Point out the red status:** "Notice the health status turned red"
- [ ] **Wait for recovery:** "Now watch what happens..."
- [ ] **Point out the recovery:** "The self-heal counter incremented, status is green again"

### **If Something Goes Wrong:**
- [ ] Don't panic—pivot to explaining the architecture
- [ ] Show the metrics endpoint directly: `curl http://localhost:8080/api/metrics`
- [ ] Explain how Guardian Bee works conceptually
- [ ] Show screenshots if live demo fails

---

## 🕐 AFTER THE DEMO

- [ ] **Thank the audience**
- [ ] **Ask for questions** (have talking points ready)
- [ ] **Take notes** on their questions/feedback
- [ ] **Follow up** with any resources they requested
- [ ] **Celebrate**—you just showed production-grade infrastructure!

---

## 🚨 EMERGENCY FALLBACKS

### **If Guardian Bee isn't working:**
- Explain the architecture conceptually
- Show the code: `zyeute/scripts/guardian-bee.ps1`
- Show the metrics endpoint: `curl http://localhost:8080/api/metrics`
- Show Grafana dashboard (even if Guardian Bee is off)

### **If Grafana isn't accessible:**
- Show Prometheus metrics directly: `curl http://localhost:8080/api/metrics`
- Show screenshots of Grafana (prepared earlier)
- Explain what the metrics would show

### **If Docker isn't running:**
- Explain the self-healing concept
- Show the Guardian Bee code
- Show how it would work in production (Railway/Cloud Run)
- Pivot to architecture discussion

### **If Network Issues:**
- Have local screenshots ready
- Explain the architecture verbally
- Show code examples from your IDE
- Offer to send resources after the demo

---

## 📝 POST-DEMO NOTES

**Take notes on:**
- Questions asked (for follow-up)
- Technical concerns raised
- Interest level in specific features
- Next steps discussed
- Contact information exchanged

---

## 🎯 SUCCESS CRITERIA

**You've succeeded if:**
- ✅ You showed the kill-switch demo (even if it didn't work perfectly)
- ✅ You explained the self-healing architecture
- ✅ You tied back to production-grade infrastructure
- ✅ You got questions about scaling/deployment
- ✅ You left them impressed with the engineering

**Remember:** Even if the live demo fails, the fact that you built this infrastructure is impressive. The architecture and thinking matter more than perfect execution.

---

**You've built a Sovereign Ecosystem. Now go show them what it can do.** 🐝🔥