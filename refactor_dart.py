import os
import re
import json

lib_dir = 'lib'
dart_files = []

for root, _, files in os.walk(lib_dir):
    for f in files:
        if f.endswith('.dart') and f != 'language_service.dart':
            dart_files.append(os.path.join(root, f))

new_mappings = {}
key_counter = 1000

for path in dart_files:
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    def replacer(match):
        global key_counter
        full_match = match.group(0)
        quote = full_match[0]
        text_inside = full_match[1:-1]
        
        if '$' in text_inside:
            return full_match 
        
        key = 'auto_trans_' + str(key_counter)
        key_counter += 1
        new_mappings[key] = text_inside
        
        return f"LanguageService.tr('{key}')"
    
    new_content = re.sub(r'[\'\"]([^\'\"\$\n]*[\u0600-\u06FF]+[^\'\"\$\n]*)[\'\"]', replacer, content)
    
    if new_content != content:
        # Check if import is there, if not add it
        if "import 'package:absher/services/language_service.dart';" not in new_content and "import '../services/language_service.dart';" not in new_content:
            new_content = "import 'package:absher/services/language_service.dart';\n" + new_content
            
        with open(path, 'w', encoding='utf-8') as file:
            file.write(new_content)

with open('new_flutter_mappings.json', 'w', encoding='utf-8') as f:
    json.dump(new_mappings, f, ensure_ascii=False, indent=2)

print(f'Replaced {len(new_mappings)} strings!')
