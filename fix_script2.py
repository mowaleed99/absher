with open('backend_php/admin/script.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("window.currentLang === 'en'", "currentLang === 'en'")

with open('backend_php/admin/script.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed currentLang reference!')
