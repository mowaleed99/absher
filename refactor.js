const fs = require('fs');
const path = require('path');

const srcCode = fs.readFileSync(path.join(__dirname, 'backend_php', 'admin', 'legacy', 'script.old.js'), 'utf-8');

// A simple utility to extract function blocks
function extractFunction(name, code) {
    const regex = new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\([\\s\\S]*?\\)\\s*\\{`, 'g');
    const match = regex.exec(code);
    if (!match) return null;
    
    let startIndex = match.index;
    let braceCount = 0;
    let endIndex = startIndex;
    let started = false;
    
    for (let i = startIndex; i < code.length; i++) {
        if (code[i] === '{') {
            braceCount++;
            started = true;
        } else if (code[i] === '}') {
            braceCount--;
        }
        
        if (started && braceCount === 0) {
            endIndex = i + 1;
            break;
        }
    }
    
    return code.substring(startIndex, endIndex);
}

function extractAll(funcs) {
    let result = '';
    for (const f of funcs) {
        const body = extractFunction(f, srcCode);
        if (body) {
            result += `export ${body}\n\n`;
        } else {
            console.warn(`Function ${f} not found!`);
        }
    }
    return result;
}

const stateJs = `export const appData = {
    apartments: [],
    services: [],
    students: [],
    requests: [],
    chats: [],
    reviews: [],
    news: [],
    notifications: [],
    universities: [],
    districts: []
};

export const API_URL = '../api/admin_api.php';
export const LOGIN_URL = '../api/admin/login.php';
`;

fs.mkdirSync(path.join(__dirname, 'backend_php', 'admin', 'js', 'modules'), { recursive: true });

fs.writeFileSync(path.join(__dirname, 'backend_php', 'admin', 'js', 'state.js'), stateJs);

console.log("Extracted state.js!");
