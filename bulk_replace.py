import glob
import re

files = glob.glob('components/*.tsx') + ['App.tsx']
for file_path in files:
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Replace cyan colors with orange
    content = re.sub(r'cyan-(\d+)', r'orange-\1', content)
    # Also fix some font stuff in other components just in case
    content = content.replace('font-black', 'font-semibold')
    content = content.replace('font-bold', 'font-medium')
    
    with open(file_path, 'w') as f:
        f.write(content)

print("Done")
