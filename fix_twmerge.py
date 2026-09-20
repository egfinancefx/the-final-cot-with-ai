import re
import os

filepath = 'utils.ts'
if os.path.exists(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Check if twMerge import exists but is wrong or missing
    if 'import { twMerge } from "tailwind-merge"' not in content:
        # Check if tailwind-merge is imported at all
        if 'tailwind-merge' in content:
            content = re.sub(r'import\s+.*?\s+from\s+["\']tailwind-merge["\'];?', 'import { twMerge } from "tailwind-merge";', content)
        else:
            content = 'import { twMerge } from "tailwind-merge";\n' + content
            
    with open(filepath, 'w') as f:
        f.write(content)
