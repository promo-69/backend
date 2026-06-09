const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'src/migrate/migrations');
const newMigrationsDir = path.join(__dirname, 'src/migrate/new-migrations');

// Helper to extract table name from createTable
function extractCreateTable(content) {
    const match = content.match(/createTable\s*\(\s*['"]([^'"]+)['"]/);
    return match ? match[1] : null;
}

// Helper to extract constraints and their target tables
function extractConstraints(content) {
    const constraints = [];
    // Match addConstraint('table', { ..., references: { table: 'target_table' } })
    const regex = /addConstraint\s*\(\s*['"][^'"]+['"]\s*,\s*\{[\s\S]*?references\s*:\s*\{\s*table\s*:\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        constraints.push(match[1]);
    }
    return constraints;
}

function verifyNewMigrationsOrder() {
    const files = fs.readdirSync(newMigrationsDir).filter(f => f.endsWith('.js')).sort();
    const createdTables = new Set();
    const errors = [];

    for (const file of files) {
        const content = fs.readFileSync(path.join(newMigrationsDir, file), 'utf8');
        
        const tableName = extractCreateTable(content);
        if (tableName) {
            createdTables.add(tableName);
        }

        const targets = extractConstraints(content);
        for (const target of targets) {
            if (!createdTables.has(target)) {
                errors.push(`File ${file} creates a constraint referencing '${target}', but '${target}' is not created yet.`);
            }
        }
    }

    if (errors.length > 0) {
        console.log("Order conflicts found:");
        errors.forEach(e => console.log(e));
    } else {
        console.log("No order conflicts found. All foreign keys reference already created tables.");
    }
}

verifyNewMigrationsOrder();
