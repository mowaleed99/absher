import os
import re

with open('backend_php/admin/js/app.js', 'r', encoding='utf-8') as f:
    code = f.read()

def extract_funcs(names):
    extracted = ""
    for name in names:
        # Regex to find function or async function or window.name = function
        pattern = r"(?:(?:async\s+)?function\s+" + name + r"\s*\(|window\." + name + r"\s*=\s*(?:async\s+)?function\s*\()"
        match = re.search(pattern, code)
        if not match:
            print(f"Warning: {name} not found")
            continue
            
        start_idx = match.start()
        # Find matching closing brace
        brace_count = 0
        in_string = False
        string_char = None
        end_idx = -1
        
        for i in range(match.end(), len(code)):
            char = code[i]
            prev_char = code[i-1] if i > 0 else ''
            
            if in_string:
                if char == string_char and prev_char != '\\':
                    in_string = False
            elif char in ["'", '"', '`']:
                in_string = True
                string_char = char
            elif char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == -1: # The function block closed! Wait, we started counting AFTER the opening brace!
                    pass
                if brace_count == 0 and code[start_idx:i].count('{') > 0: # Ensure we actually entered the block
                    end_idx = i + 1
                    break
        
        if end_idx != -1:
            extracted += "export " + code[start_idx:end_idx] + "\n\n"
        else:
            print(f"Warning: could not parse {name}")
    return extracted

# Actually, an easier way is to just use standard JS module exports.
