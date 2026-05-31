// Ad-hoc SQL runner for the linked Supabase cloud database.
//
// Reads SUPABASE_DB_URL from .env (gitignored) and runs SQL given either as
// an inline string or a .sql file path.
//
//   node scripts/db.mjs --sql "select count(*) from public.profiles;"
//   node scripts/db.mjs database/add_barber.sql
//
// Multiple statements in one input are supported.

import { readFileSync } from 'node:fs'
import pg from 'pg'

function loadDbUrl() {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL
  try {
    const env = readFileSync(new URL('../.env', import.meta.url), 'utf8')
    for (const line of env.split('\n')) {
      const match = line.match(/^\s*SUPABASE_DB_URL\s*=\s*(.+)\s*$/)
      if (match) return match[1].trim().replace(/^["']|["']$/g, '')
    }
  } catch {
    /* ignore */
  }
  return null
}

async function main() {
  const args = process.argv.slice(2)
  let sql = null

  const sqlFlag = args.indexOf('--sql')
  if (sqlFlag !== -1) {
    sql = args[sqlFlag + 1]
  } else if (args[0]) {
    sql = readFileSync(args[0], 'utf8')
  }

  if (!sql) {
    console.error('Usage: node scripts/db.mjs <file.sql> | --sql "<query>"')
    process.exit(1)
  }

  const connectionString = loadDbUrl()
  if (!connectionString) {
    console.error('Missing SUPABASE_DB_URL. Add it to .env (see chat instructions).')
    process.exit(1)
  }

  const client = new pg.Client({
    connectionString,
    // Supabase requires TLS; the pooler cert is not in the local trust store.
    ssl: { rejectUnauthorized: false }
  })

  await client.connect()
  try {
    const result = await client.query(sql)
    const results = Array.isArray(result) ? result : [result]
    for (const r of results) {
      if (r.rows && r.rows.length) {
        console.table(r.rows)
      } else {
        console.log(`${r.command || 'OK'} (${r.rowCount ?? 0} rows)`)
      }
    }
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('DB error:', err.message)
  process.exit(1)
})
