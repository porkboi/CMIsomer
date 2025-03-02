import Database from "better-sqlite3"
import { join } from "path"
import fs from "fs"

// Ensure the data directory exists
const dataDir = join(process.cwd(), "data")
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Create or connect to the database
const dbPath = join(dataDir, "party.db")
const db = new Database(dbPath)

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    andrewID TEXT NOT NULL UNIQUE,
    age INTEGER NOT NULL,
    organization TEXT NOT NULL,
    paymentMethod TEXT NOT NULL,
    paymentConfirmed TEXT NOT NULL,
    status TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`)

// Initialize with some data if the table is empty
const count = db.prepare("SELECT COUNT(*) as count FROM registrations").get() as { count: number }

if (count.count === 0) {
  const initialData = [
    {
      name: "Christian Ang",
      andrewID: "cang2",
      age: 23,
      organization: "SSA",
      paymentMethod: "venmo",
      paymentConfirmed: "yes",
      status: "confirmed",
    },
    {
      name: "Ellyse Lai",
      andrewID: "ellysel",
      age: 19,
      organization: "HKSA",
      paymentMethod: "venmo",
      paymentConfirmed: "yes",
      status: "confirmed",
    },
  ]

  const insert = db.prepare(`
    INSERT INTO registrations (name, andrewID, age, organization, paymentMethod, paymentConfirmed, status)
    VALUES (@name, @andrewID, @age, @organization, @paymentMethod, @paymentConfirmed, @status)
  `)

  const insertMany = db.transaction((registrations) => {
    for (const registration of registrations) {
      insert.run(registration)
    }
  })

  insertMany(initialData)
}

export default db

