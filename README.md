# 66 — SixtySix file map

A Markdown workspace with a draggable graph, collapsible folders, a text editor, Markdown connections, and a revision archive. Hosted on Vercel with Google Drive as file storage.

## Deploy

Connect this repository to your Vercel project and use main as the production branch. The included vercel.json serves public/ and the API functions in api/. The framework is Other, with no install or build command.

Set these server-only environment variables for Production in Vercel:

- APP_ORIGIN: the exact HTTPS application origin, without a trailing slash
- GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET: your Google OAuth web client
- ALLOWED_EMAIL: the Google account permitted to use the workspace
- DRIVE_FOLDER_ID: the root Drive folder ID
- SESSION_SECRET: 32 random bytes encoded as 64 hexadecimal characters

Register APP_ORIGIN/api/callback as the Google OAuth redirect URI and enable Google Drive API. The client requests openid, email and Drive access. Redeploy after changing environment variables. Never commit credentials or private project files.

## Local development

Node.js 22+ is required. No dependencies are needed.

Run npm run dev, then open http://127.0.0.1:4317. The local preview starts empty unless a private seed.json is supplied. It stores local test edits in .local-state.json and does not synchronize with Drive. Both files are excluded from Git and deployments.

Run npm test for path, Markdown-link, revision, conflict and OAuth-entrypoint regression tests. Tests use synthetic files.

## Synchronization and history

Production reads the configured Drive folder and refreshes every 15 seconds. Saves retain the same Drive file ID and archive snapshots in .sixtysix-history. Restoration creates a new edit. The editor supports restoring a complete iteration or selected changed sections.

An open website archives external states it observes. Polling cannot capture every external edit made while the site is closed or between refreshes. External writers, including chat sessions, must archive the prior and committed content to retain every iteration. Changes made only in chat text or other attachments are not automatically synchronized.

Snapshot files live in the history folder, with names starting with the source Drive file ID followed by a hyphen and ending in .json. Each contains sourceId, id, content, time (ISO 8601), and author.

## Verification status

Local regression tests pass. Google OAuth, actual Drive writes and the browser interactions must still be verified end to end on the deployed site. Production writes require an ETag for conditional updates and fail closed if one is unavailable.
