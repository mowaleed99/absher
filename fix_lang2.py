with open('backend_php/admin/lang.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix tr() to normalize strings
tr_old = '''function tr(arText) {
    if (currentLang === 'ar') return arText;
    
    // Find key by searching the 'ar' dictionary for the exact text
    const entries = Object.entries(translations['ar']);
    for (let [key, val] of entries) {
        if (val.trim() === arText.trim()) {
            return translations['en'][key] || arText;
        }
    }
    return arText; // Fallback
}'''

tr_new = '''function tr(arText) {
    if (currentLang === 'ar') return arText;
    
    // Normalize string to ignore multi-line whitespace
    const norm = (str) => str.replace(/\s+/g, ' ').trim();
    const search = norm(arText);
    
    // Find key by searching the 'ar' dictionary for the exact text
    const entries = Object.entries(translations['ar']);
    for (let [key, val] of entries) {
        if (norm(val) === search) {
            return translations['en'][key] || arText;
        }
    }
    return arText; // Fallback
}'''

content = content.replace(tr_old, tr_new)

# Fix walkAndTranslate to assign directly
walk_old = '''// Store original Arabic text on elements to allow flipping back
function walkAndTranslate(node) {
    if (node.nodeType === 3) { // Text node
        const text = node.nodeValue.trim();
        if (text) {
            if (!node.parentElement.hasAttribute('data-orig-text')) {
                node.parentElement.setAttribute('data-orig-text', text);
            }
            const orig = node.parentElement.getAttribute('data-orig-text');
            const translated = tr(orig);
            if (translated !== orig) {
                node.nodeValue = node.nodeValue.replace(text, translated);
            } else if (currentLang === 'ar') {
                node.nodeValue = node.nodeValue.replace(text, orig);
            }
        }
    } else if (node.nodeType === 1 && node.nodeName !== "SCRIPT" && node.nodeName !== "STYLE") {
        for (let i = 0; i < node.childNodes.length; i++) {
            walkAndTranslate(node.childNodes[i]);
        }
    }
}'''

walk_new = '''// Store original Arabic text on elements to allow flipping back
function walkAndTranslate(node) {
    if (node.nodeType === 3) { // Text node
        const text = node.nodeValue.trim();
        if (text) {
            if (!node.parentElement.hasAttribute('data-orig-text')) {
                // Store the exact original value
                node.parentElement.setAttribute('data-orig-text', node.nodeValue);
            }
            const orig = node.parentElement.getAttribute('data-orig-text');
            const translated = tr(orig);
            
            // Just replace the text content of the node entirely to avoid whitespace matching issues
            if (translated !== orig && currentLang === 'en') {
                node.nodeValue = translated;
            } else if (currentLang === 'ar') {
                node.nodeValue = orig;
            }
        }
    } else if (node.nodeType === 1 && node.nodeName !== "SCRIPT" && node.nodeName !== "STYLE") {
        for (let i = 0; i < node.childNodes.length; i++) {
            walkAndTranslate(node.childNodes[i]);
        }
    }
}'''

content = content.replace(walk_old, walk_new)

with open('backend_php/admin/lang.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('lang.js whitespace normalization applied!')
