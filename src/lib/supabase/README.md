# Supabase Client Setup

This folder contains the Supabase client configuration for Praxis AI.

## Configuration

Environment variables are configured in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://nwwesogezwemoevhfvgi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Usage

### In Client Components

For components with `"use client"` directive:

```typescript
import { createClient } from '@/lib/supabase/client'

export default function MyComponent() {
  const supabase = createClient()

  async function fetchData() {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
  }

  return <div>...</div>
}
```

### In Server Components

For server components (default in App Router):

```typescript
import { createClient } from '@/lib/supabase/server'

export default async function MyServerComponent() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('participants')
    .select('*')

  return <div>...</div>
}
```

### In API Routes

For API routes in `app/api/`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('participants')
    .select('*')

  return NextResponse.json({ data, error })
}
```

## Authentication

The middleware in `src/middleware.ts` handles authentication token refresh automatically.

### Example: Sign Up

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
})
```

### Example: Sign In

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
})
```

### Example: Get Current User

```typescript
const { data: { user } } = await supabase.auth.getUser()
```

### Example: Sign Out

```typescript
const { error } = await supabase.auth.signOut()
```

## Database Operations

### Select Data

```typescript
const { data, error } = await supabase
  .from('participants')
  .select('*')
  .eq('status', 'active')
```

### Insert Data

```typescript
const { data, error } = await supabase
  .from('participants')
  .insert([
    { name: 'John Doe', ndis_number: '123456' }
  ])
```

### Update Data

```typescript
const { data, error } = await supabase
  .from('participants')
  .update({ status: 'inactive' })
  .eq('id', userId)
```

### Delete Data

```typescript
const { data, error } = await supabase
  .from('participants')
  .delete()
  .eq('id', userId)
```

## Real-time Subscriptions

```typescript
const channel = supabase
  .channel('participants-changes')
  .on('postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'participants'
    },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
```

## Storage

### Upload File

```typescript
const { data, error } = await supabase.storage
  .from('documents')
  .upload('reports/file.pdf', file)
```

### Download File

```typescript
const { data, error } = await supabase.storage
  .from('documents')
  .download('reports/file.pdf')
```

### Get Public URL

```typescript
const { data } = supabase.storage
  .from('documents')
  .getPublicUrl('reports/file.pdf')
```

## Edge Functions

```typescript
const { data, error } = await supabase.functions.invoke('my-function', {
  body: { name: 'John' }
})
```

## More Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js App Router Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
