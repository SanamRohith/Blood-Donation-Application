<<<<<<< HEAD
# Blood_Info_Services

Privacy-focused blood donor management and donor finder platform.

## Stack
- Frontend: HTML5, CSS3, JavaScript
- Backend: Python Flask
- Database: MongoDB (local)
- Auth: Flask Sessions + bcrypt

## MongoDB
- Connection: `mongodb://localhost:27017/`
- Database: `blood_donor_db`
- Collections:
  - `users`
  - `chats`
  - `messages`

## Run locally
1. Start MongoDB Community Server.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the app:
   ```bash
   python app.py
   ```
4. Open in browser:
   - http://localhost:5000/

## Routes (core)
- `GET /` landing
- `GET/POST /register`
- `GET/POST /login`
- `GET /logout`
- `GET /dashboard`
- `GET/POST /profile`
- `GET /api/search_donors`
- `GET /api/recent_donors`
- `POST /api/create_chat`
- `GET /chat/<chat_id>`
- `POST /send_message`
- `GET /get_messages`

## Privacy notes
- Donor phone numbers are never returned in donor search results.
- Chat stores sender alias (name) and messages without phone numbers.


=======
# Blood-Donation-Application
>>>>>>> d6be9d8ff07fe3d750563b7682bbceb39717cc7d
