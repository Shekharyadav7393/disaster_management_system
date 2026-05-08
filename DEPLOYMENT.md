# Deployment Guide

This repository is now prepared for a Render deployment with:

- a Node web service for the app
- a private MongoDB service on Render
- Cloudinary for media uploads

## Render Setup

The repo root includes [render.yaml](D:/Disaster-Management-System/render.yaml:1).

When you create a new Blueprint in Render and point it to this repository, it will define:

- `disaster-management-system` as the public web app
- `disaster-management-mongodb` as the private MongoDB service

Important:

- the MongoDB private service needs a persistent disk
- the web service is set to the `starter` plan in `render.yaml`
- Cloudinary credentials must be added in Render before uploads will offload to Cloudinary

## Required Render Environment Variables

Set these in the Render web service:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
GEMINI_API_KEY=
OPENWEATHER_API_KEY=
```

You do not need to set `MONGO_URI` if you deploy through the provided Render Blueprint, because the app can connect using the private Mongo service host.

## Local Production Check

From the project root:

```bash
npm run build
npm start
```

The app will be available on `http://localhost:5000`.

## Cloudinary Behavior

If Cloudinary credentials are present:

- report images/videos upload to Cloudinary
- SOS images/videos upload to Cloudinary
- deleting media attempts to remove the Cloudinary asset too

If Cloudinary credentials are missing, the app falls back to local `/uploads` storage.

## Security Note

Before pushing public deployment changes, remove tracked `.env` files from the repository history and keep only `.env.example` files in git.
