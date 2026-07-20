import re

with open('backend_php/admin/script.js', 'r', encoding='utf-8') as f:
    content = f.read()

injection = "\n    if (typeof walkAndTranslate === 'function' && window.currentLang === 'en') walkAndTranslate(document.body);"

funcs = ['renderStats', 'renderApartments', 'renderServices', 'renderRequests', 'renderStudents', 'renderChats', 'renderReviews', 'renderUniversities', 'renderDistricts', 'renderNews', 'renderNotifications']

for func in funcs:
    match = re.search(r'^function ' + func + r'\b.*?\n\}', content, flags=re.DOTALL | re.MULTILINE)
    if match:
        func_body = match.group(0)
        if 'walkAndTranslate(' not in func_body:
            last_brace_idx = func_body.rfind('}')
            new_func_body = func_body[:last_brace_idx] + injection + '\n}'
            content = content.replace(func_body, new_func_body)

with open('backend_php/admin/script.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('Injected successfully!')
