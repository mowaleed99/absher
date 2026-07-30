import os
import re

admin_dir = r'c:\Users\moham\Desktop\absher\backend_php\admin'
results = []

# Scan index.html
html_path = os.path.join(admin_dir, 'index.html')
if os.path.exists(html_path):
    with open(html_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        for idx, line in enumerate(lines, 1):
            # Match any Arabic text in index.html (excluding lines with data-i18n that also have static text)
            # We want to identify strings that don't have data-i18n
            arabic_matches = re.findall(r'([\u0600-\u06FF\s]+)', line)
            # clean up spaces
            arabic_matches = [m.strip() for m in arabic_matches if m.strip()]
            if arabic_matches:
                # check if the line contains data-i18n
                has_i18n = 'data-i18n' in line
                results.append(('index.html', idx, line.strip(), arabic_matches, has_i18n))

# Scan JS files in admin/js
js_dir = os.path.join(admin_dir, 'js')
for root, _, files in os.walk(js_dir):
    for filename in files:
        if filename.endswith('.js'):
            path = os.path.join(root, filename)
            rel_path = os.path.relpath(path, admin_dir)
            with open(path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                for idx, line in enumerate(lines, 1):
                    # Match strings in JS
                    arabic_matches = re.findall(r'([\u0600-\u06FF]+)', line)
                    if arabic_matches:
                        results.append((rel_path, idx, line.strip(), arabic_matches, False))

# Write results
out_path = os.path.join(admin_dir, 'arabic_audit_admin.txt')
with open(out_path, 'w', encoding='utf-8') as out:
    out.write("AUDIT REPORT: HARDCODED ARABIC STRINGS IN ADMIN\n")
    out.write("================================================\n\n")
    
    # Group by file
    files_grouped = {}
    for fpath, line_no, line_content, matches, has_i18n in results:
        if fpath not in files_grouped:
            files_grouped[fpath] = []
        files_grouped[fpath].append((line_no, line_content, matches, has_i18n))
        
    for fpath, occurrences in files_grouped.items():
        out.write(f"File: {fpath}\n")
        out.write("-" * len(f"File: {fpath}") + "\n")
        for line_no, line_content, matches, has_i18n in occurrences:
            status = "[HAS data-i18n]" if has_i18n else "[NO TRANSLATION KEY]"
            out.write(f"  Line {line_no}: {line_content}\n")
            out.write(f"    Arabic texts: {matches} {status}\n")
        out.write("\n")

print(f"Audit complete! Results written to {out_path}")
