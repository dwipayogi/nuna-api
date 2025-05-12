# Nuna API

A simple authentication API built with Express, TypeScript, and Prisma.

## Setup

1. Install dependencies:

```
npm install
```

2. Set up your PostgreSQL database and update the `.env` file with your database credentials.

3. Run Prisma migrations to create your database tables:

```
npx prisma migrate dev --name init
```

4. Generate Prisma client:

```
npx prisma generate
```

5. Start the development server:

```
npm run dev
```

## API Endpoints

### Authentication

- **Register a new user**

  - POST `/api/auth/register`
  - Body: `{ "username": "yourname", "email": "your@email.com", "password": "yourpassword" }`

- **Login**

  - POST `/api/auth/login`
  - Body: `{ "email": "your@email.com", "password": "yourpassword" }`

- **Get user profile** (Protected route)
  - GET `/api/auth/profile`
  - Headers: `Authorization: Bearer YOUR_JWT_TOKEN`

### Journals (All Protected)

- **Get all journals**

  - GET `/api/journals`
  - Headers: `Authorization: Bearer YOUR_JWT_TOKEN`

- **Get journal by ID**

  - GET `/api/journals/:id`
  - Headers: `Authorization: Bearer YOUR_JWT_TOKEN`

- **Create journal**

  - POST `/api/journals`
  - Headers: `Authorization: Bearer YOUR_JWT_TOKEN`
  - Body: `{ "title": "My Journal", "content": "Today was a good day", "mood": "happy" }`

- **Update journal**

  - PUT `/api/journals/:id`
  - Headers: `Authorization: Bearer YOUR_JWT_TOKEN`
  - Body: `{ "title": "Updated Title", "content": "Updated content" }`

- **Delete journal**
  - DELETE `/api/journals/:id`
  - Headers: `Authorization: Bearer YOUR_JWT_TOKEN`

### Posts

- **Get all posts** (Public)

  - GET `/api/posts`

- **Get post by ID** (Public)

  - GET `/api/posts/:id`

- **Get posts by user ID** (Public)

  - GET `/api/posts/user/:userId`

- **Get current user's posts** (Protected)

  - GET `/api/posts/my/posts`
  - Headers: `Authorization: Bearer YOUR_JWT_TOKEN`

- **Create post** (Protected)

  - POST `/api/posts`
  - Headers: `Authorization: Bearer YOUR_JWT_TOKEN`
  - Body: `{ "title": "Post Title", "content": "Post content", "tags": ["tag1", "tag2"] }`

- **Update post** (Protected, only post owner)

  - PUT `/api/posts/:id`
  - Headers: `Authorization: Bearer YOUR_JWT_TOKEN`
  - Body: `{ "title": "Updated Title", "content": "Updated content" }`

- **Delete post** (Protected, only post owner)
  - DELETE `/api/posts/:id`
  - Headers: `Authorization: Bearer YOUR_JWT_TOKEN`

### Comments

- **Get comments by post ID** (Public)

  - GET `/api/comments/post/:postId`

- **Create comment** (Protected)

  - POST `/api/comments`
  - Headers: `Authorization: Bearer YOUR_JWT_TOKEN`
  - Body: `{ "content": "Comment content", "postId": "post-id-here" }`

- **Update comment** (Protected, only comment owner)

  - PUT `/api/comments/:id`
  - Headers: `Authorization: Bearer YOUR_JWT_TOKEN`
  - Body: `{ "content": "Updated comment" }`

- **Delete comment** (Protected, only comment owner or post owner)
  - DELETE `/api/comments/:id`
  - Headers: `Authorization: Bearer YOUR_JWT_TOKEN`

## Running in Production

For production, make sure to:

1. Change the JWT_SECRET in your environment variables
2. Set up proper database credentials
3. Use a process manager like PM2 to run the application
