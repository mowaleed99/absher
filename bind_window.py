import re

with open('backend_php/admin/legacy/script.old.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Find all function names
# matching `function name(` or `async function name(`
matches = re.findall(r'function\s+([a-zA-Z0-9_]+)\s*\(', code)
matches = list(set(matches)) # unique

export_code = "\n// --- TEMPORARY WINDOW BINDINGS --- \n"
for m in matches:
    export_code += f"window.{m} = {m};\n"

with open('backend_php/admin/js/app.js', 'a', encoding='utf-8') as f:
    f.write(export_code)

print("Exported", len(matches), "functions to window!")
