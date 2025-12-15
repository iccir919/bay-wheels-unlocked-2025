import { createLocalClient } from "./localClient.js"

const DB_TARGET = process.env.DB_TARGE || "local"

let db

if (DB_TARGET === "local") {
    db = createLocalClient()
} else {
    // db = createSupabaseClient()
}

export default db