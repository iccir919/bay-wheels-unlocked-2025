import { createLocalClient } from "./localClient.js"

const DB_TARGET = process.env.DB_TARGET || "Local"

let db
console.log(DB_TARGET)
if (DB_TARGET === "Local") {
    db = createLocalClient()
} else {
    // db = createSupabaseClient()
}

export default db