import PocketBase from 'pocketbase/cjs'

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090')

// Load auth store from cookie on client-side
if (typeof window !== 'undefined') {
  pb.authStore.loadFromCookie(document.cookie)
}

export default pb