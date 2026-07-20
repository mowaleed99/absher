import os
import re

# 1. Fix home_screen.dart
with open('lib/screens/home_screen.dart', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix const Text
content = re.sub(r'const\s+Text\(LanguageService\.tr\(', r'Text(LanguageService.tr(', content)
content = re.sub(r'const\s+LanguageService\.tr', r'LanguageService.tr', content)

# Fix rLanguageService regex typo
content = content.replace("rLanguageService.tr('auto_trans_1159')", r"r'(\d+)\s*دقيقة'")

with open('lib/screens/home_screen.dart', 'w', encoding='utf-8') as f:
    f.write(content)

# 2. Fix apartment_detail_screen.dart
with open('lib/screens/apartment_detail_screen.dart', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'const\s+Text\(LanguageService\.tr\(', r'Text(LanguageService.tr(', content)
content = re.sub(r'const\s+LanguageService\.tr', r'LanguageService.tr', content)

# Fix: LanguageService.tr('auto_trans_1007')${widget.apartment['title']}LanguageService.tr('auto_trans_1008')
# to: "${LanguageService.tr('auto_trans_1007')} ${widget.apartment['title']} ${LanguageService.tr('auto_trans_1008')}"
content = content.replace(
    "LanguageService.tr('auto_trans_1007')${widget.apartment['title']}LanguageService.tr('auto_trans_1008')",
    "\"${LanguageService.tr('auto_trans_1007')} ${widget.apartment['title']} ${LanguageService.tr('auto_trans_1008')}\""
)

# Fix notesController ternary
content = content.replace(
    "LanguageService.tr('auto_trans_1015')}\\n\\n'",
    "\"${LanguageService.tr('auto_trans_1015')}\"}\\n\\n'"
)

with open('lib/screens/apartment_detail_screen.dart', 'w', encoding='utf-8') as f:
    f.write(content)

# 3. Fix rent_flat_screen.dart
with open('lib/screens/rent_flat_screen.dart', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('const aloneMsg = LanguageService.tr', 'final aloneMsg = LanguageService.tr')
content = re.sub(r'const\s+Text\(LanguageService\.tr\(', r'Text(LanguageService.tr(', content)
content = re.sub(r'const\s+Expanded\(\s*child:\s*Text\(LanguageService\.tr\(', r'Expanded(child: Text(LanguageService.tr(', content)

# rent_flat_screen.dart:106:53: Error: Expected ';' after this.
# final msg = LanguageService.tr('auto_trans_1216')
content = content.replace(
    "final msg = LanguageService.tr('auto_trans_1216')\n",
    "final msg = LanguageService.tr('auto_trans_1216');\n"
)

with open('lib/screens/rent_flat_screen.dart', 'w', encoding='utf-8') as f:
    f.write(content)

# 4. Fix notifications_screen.dart
with open('lib/screens/notifications_screen.dart', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'const\s+Text\(LanguageService\.tr\(', r'Text(LanguageService.tr(', content)
content = re.sub(r'const\s+LanguageService\.tr', r'LanguageService.tr', content)

with open('lib/screens/notifications_screen.dart', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed errors!')
