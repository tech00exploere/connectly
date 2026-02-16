# Deployment (Render + Vercel)

## Backend (Render Web Service)

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Environment Variables:
  - `PORT=5000`
  - `MONGO_URI=<your_mongodb_uri>`
  - `JWT_SECRET=<your_secret>`
  - `CLIENT_URL=https://commitpostop.vercel.app,https://connectlytoconnect-nmto8238q-priyanshus-projects-2c0c2b1d.vercel.app`

## Frontend (Vercel Project)

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables:
  - `VITE_API_URL=https://<your-render-service>.onrender.com/api`

## Notes

- `CLIENT_URL` supports multiple origins as a comma-separated list.
- All frontend API, socket, and media URLs are derived from `VITE_API_URL`.
- After changing env variables, redeploy both services.
