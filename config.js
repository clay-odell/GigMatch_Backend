require('dotenv').config();

const DATABASE_URL = process.env.VITE_PSQL_URL || "postgresql://localhost:5432";
console.log(DATABASE_URL);
const port = process.env.PORT || 3000;
const SECRET_KEY = process.env.VITE_SECRET_KEY || "my-secret-key";
function getDatabaseUri() {
    return process.env.NODE_ENV === "test"
      ? `${DATABASE_URL}/gigmatch_test`
      : `${DATABASE_URL}`;
}

const BCRYPT_WORK_FACTOR = process.env.BCRYPT_WORK_FACTOR || 14;

module.exports = {
    DATABASE_URL,
    port,
    getDatabaseUri,
    BCRYPT_WORK_FACTOR,
    SECRET_KEY
};
