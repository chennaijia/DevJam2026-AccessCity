/**
 * 資料存取層：同一組介面，兩種實作
 *   - Firestore（設定了 NUXT_FIREBASE_SERVICE_ACCOUNT 時）
 *   - 記憶體（沒有金鑰時的 demo 後備，重啟就歸零）
 *
 * 上層的 repo / handler 只認這個介面，所以之後要換資料庫也只改這個檔案。
 */
import { getDb } from './firebase'

export interface Doc {
  id: string
}

export interface Collection<T extends Doc> {
  list(where?: Partial<T>): Promise<T[]>
  get(id: string): Promise<T | null>
  set(doc: T): Promise<T>
  update(id: string, patch: Partial<T>): Promise<T>
  remove(id: string): Promise<void>
  /** 集合是空的時候塞入預設資料（demo 種子資料用） */
  seed(docs: T[]): Promise<void>
}

function matches<T extends Doc>(doc: T, where?: Partial<T>) {
  if (!where) return true
  return Object.entries(where).every(([key, value]) => (doc as Record<string, unknown>)[key] === value)
}

/* ------------------------------------------------------------------ 記憶體 */

class MemoryCollection<T extends Doc> implements Collection<T> {
  private rows: T[] = []
  private seeded = false

  async list(where?: Partial<T>) {
    return this.rows.filter((row) => matches(row, where)).map((row) => structuredClone(row))
  }

  async get(id: string) {
    const row = this.rows.find((r) => r.id === id)
    return row ? structuredClone(row) : null
  }

  async set(doc: T) {
    const index = this.rows.findIndex((r) => r.id === doc.id)
    if (index >= 0) this.rows[index] = structuredClone(doc)
    else this.rows.push(structuredClone(doc))
    return doc
  }

  async update(id: string, patch: Partial<T>) {
    const index = this.rows.findIndex((r) => r.id === id)
    if (index < 0) throw createError({ statusCode: 404, statusMessage: `找不到 ${id}` })
    this.rows[index] = { ...this.rows[index]!, ...patch }
    return structuredClone(this.rows[index]!)
  }

  async remove(id: string) {
    this.rows = this.rows.filter((r) => r.id !== id)
  }

  async seed(docs: T[]) {
    if (this.seeded || this.rows.length) return
    this.rows = docs.map((doc) => structuredClone(doc))
    this.seeded = true
  }
}

/* ---------------------------------------------------------------- Firestore */

class FirestoreCollection<T extends Doc> implements Collection<T> {
  constructor(private name: string) {}

  private get ref() {
    const db = getDb()
    if (!db) throw createError({ statusCode: 500, statusMessage: 'Firestore 尚未設定' })
    return db.collection(this.name)
  }

  async list(where?: Partial<T>) {
    let query: FirebaseFirestore.Query = this.ref
    for (const [key, value] of Object.entries(where ?? {})) {
      query = query.where(key, '==', value)
    }
    const snapshot = await query.get()
    return snapshot.docs.map((doc) => ({ ...(doc.data() as T), id: doc.id }))
  }

  async get(id: string) {
    const snapshot = await this.ref.doc(id).get()
    return snapshot.exists ? ({ ...(snapshot.data() as T), id: snapshot.id }) : null
  }

  async set(doc: T) {
    await this.ref.doc(doc.id).set(doc, { merge: true })
    return doc
  }

  async update(id: string, patch: Partial<T>) {
    await this.ref.doc(id).set(patch, { merge: true })
    const updated = await this.get(id)
    if (!updated) throw createError({ statusCode: 404, statusMessage: `找不到 ${id}` })
    return updated
  }

  async remove(id: string) {
    await this.ref.doc(id).delete()
  }

  async seed(docs: T[]) {
    const existing = await this.ref.limit(1).get()
    if (!existing.empty) return

    const db = getDb()!
    const batch = db.batch()
    for (const doc of docs) batch.set(this.ref.doc(doc.id), doc)
    await batch.commit()
  }
}

/* ------------------------------------------------------------------ 工廠 */

const memoryCollections = new Map<string, MemoryCollection<never>>()

export function collection<T extends Doc>(name: string): Collection<T> {
  if (getDb()) return new FirestoreCollection<T>(name)

  if (!memoryCollections.has(name)) memoryCollections.set(name, new MemoryCollection())
  return memoryCollections.get(name) as unknown as Collection<T>
}
