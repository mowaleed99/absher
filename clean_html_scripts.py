import re

with open('backend_php/admin/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all script tags in index.html
script_tags = re.findall(r'<script src="js/.*?"></script>', content)

# Remove all js/ scripts except we will replace them with one app.js
for tag in script_tags:
    content = content.replace(tag + '\n', '')
    content = content.replace(tag, '')

# Inject <script type="module" src="js/app.js"></script> right before </body>
content = content.replace('</body>', '    <script type="module" src="js/app.js"></script>\n</body>')

with open('backend_php/admin/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Scripts cleaned in index.html")
