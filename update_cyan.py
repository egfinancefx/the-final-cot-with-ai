import re

with open('components/CompareView.tsx', 'r') as f:
    content = f.read()

# Replace all cyan with orange for highlights
content = content.replace('cyan', 'orange')

with open('components/CompareView.tsx', 'w') as f:
    f.write(content)
