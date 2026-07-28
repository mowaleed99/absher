import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove onmouseover and onmouseout and add class "hover-scale"
    content = content.replace('''onmouseover="this.style.transform='scale(1.02)'"onmouseout="this.style.transform='scale(1)'"''', 'class="hover-scale"')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

js_dir = 'backend_php/admin/js/'
for root, dirs, files in os.walk(js_dir):
    for file in files:
        if file.endswith('.js'):
            process_file(os.path.join(root, file))

print("Clean 3 done")
