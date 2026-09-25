# WebGuard — AI Website Security & Performance Analyzer

A full-stack Chrome Extension + FastAPI + SQLite project.

## Stack
- Chrome Extension Manifest V3
- HTML/CSS/JavaScript
- Python FastAPI
- SQLite + SQLAlchemy
- REST API
- Optional OpenAI-compatible AI endpoint

## 1. Run the backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload
```

Backend: http://127.0.0.1:8000
API docs: http://127.0.0.1:8000/docs

## 2. Load the extension

1. Open Chrome.
2. Go to `chrome://extensions`
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the `extension` folder.
6. Open any website.
7. Click the WebGuard extension and press **Scan Website**.

## 3. Dashboard

Open `dashboard/index.html` with a local server, for example:

```bash
cd dashboard
python -m http.server 5500
```

Then open http://127.0.0.1:5500

## Notes

The scanner uses browser-side checks that are safe to run from an extension:
- HTTPS
- viewport/meta checks
- title/meta description
- images without alt text
- resource counts
- inline scripts
- links
- basic performance timing

The backend stores scan reports. AI recommendations are generated locally by default using deterministic rules, so the project works without an AI key. An AI provider can be added later in `backend/main.py`.
