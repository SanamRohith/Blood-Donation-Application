# Blood_Info_Services - Implementation Tracker

## Step 1: Bootstrap project scaffold
- [x] Inspect repo directory (verified empty)
- [ ] Create `app.py`
- [ ] Create `requirements.txt`
- [ ] Create `templates/` and add landing/auth/dashboard/chat pages
- [ ] Create `static/` assets (`style.css`, `script.js`)

## Step 2: Backend implementation (Flask + MongoDB)
- [ ] MongoDB connection (pymongo) to `blood_donor_db`
- [ ] User registration with bcrypt hashing and duplicate-phone validation
- [ ] Login with Flask session auth
- [ ] Forgot password + reset password flow (secure token)
- [ ] Protected routes for dashboard/profile/chat

## Step 3: Donor search + dashboard
- [ ] Donor search API with filters (blood group, city partial, pincode)
- [ ] Recent donors section API using MongoDB sorting/limit
- [ ] Available donors logic (only users with `available=true`)

## Step 4: Private anonymous chat
- [ ] Create chat session (temporary)
- [ ] Send message endpoint
- [ ] Poll messages endpoint (every 2s)
- [ ] Chat UI integration (auto-scroll, bubbles)

## Step 5: Security & error handling
- [ ] Route guards and user-friendly error messages
- [ ] Ensure no phone numbers are exposed in donor search results

## Step 6: Final validation
- [ ] Run server locally
- [ ] Register/login/search/chat/profile tests
- [ ] Confirm MongoDB collections: `users`, `chats`, `messages`

