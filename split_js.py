import os
import re

with open('backend_php/admin/js/app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def get_block(start_marker, end_marker):
    start = -1
    end = -1
    for i, line in enumerate(lines):
        if line.startswith(start_marker): start = i
        if end_marker and line.startswith(end_marker): end = i
    if end == -1: end = len(lines)
    return lines[start:end]

os.makedirs('backend_php/admin/js/modules', exist_ok=True)

state_lines = lines[0:2] + lines[115:127]
auth_lines = lines[3:63]
util_lines = lines[63:114] + lines[228:235]
router_lines = lines[138:181]
ui_lines = lines[182:195] + lines[551:564] + lines[1701:1710]

# This is getting complicated... Let's just create a simplified version!
