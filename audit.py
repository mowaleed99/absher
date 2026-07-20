import os
import re

lib_dir = 'lib'
untranslated_files = []

for root, _, files in os.walk(lib_dir):
    for f in files:
        if f.endswith('.dart') and f != 'language_service.dart':
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
                matches = re.findall(r'([\'"][^\'"]*[\u0600-\u06FF]+[^\'"]*[\'"])', content)
                # Filter matches that are NOT inside LanguageService.tr()
                # Actually, LanguageService.tr('key') doesn't have Arabic chars if the keys are in English!
                # Wait, the keys are sometimes in Arabic if I didn't refactor them.
                # Let's just dump ALL Arabic strings.
                if matches:
                    untranslated_files.append((path, matches))

with open('arabic_audit.txt', 'w', encoding='utf-8') as out:
    for path, matches in untranslated_files:
        out.write(path + ':\n')
        for m in matches:
            out.write('  ' + m + '\n')
print('Audit complete!')
