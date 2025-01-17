/**
 * Helper function to generate a partial SQL UPDATE statement.
 * @param {string} table - The name of the table to update.
 * @param {object} items - An object containing the fields to update and their new values.
 * @param {string} key - The key to identify the row to update.
 * @param {any} id - The value of the key to identify the row to update.
 * @returns {object} - An object containing the SQL query string and the values array.
 */
function sqlForPartialUpdate(table, items, key, id) {
    // Get the keys of the items to update
    const keys = Object.keys(items);
    // Create the SET clause of the SQL statement
    const cols = keys.map((colName, idx) => `"${colName}"=$${idx + 1}`);
  
    // Create the SQL statement
    const query = `UPDATE "${table}" SET ${cols.join(", ")} WHERE "${key}"=$${keys.length + 1} RETURNING *`;
  
    // Create the array of values
    const values = [...Object.values(items), id];
  
    return { query, values };
  }
  
  module.exports = { sqlForPartialUpdate };
  