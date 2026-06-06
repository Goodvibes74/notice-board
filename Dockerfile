# ── Stage 1: Build ──────────────────────────────────────────
# Use Node to install dependencies and compile the React app
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files first (better Docker layer caching)
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the source code and build
COPY . .
RUN npm run build
# Output goes to /app/dist


# ── Stage 2: Serve ──────────────────────────────────────────
# Use lightweight Nginx to serve the compiled static files
FROM nginx:alpine

# Remove default Nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy only the built output from Stage 1 — nothing else
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx needs this config to handle React Router paths correctly
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]