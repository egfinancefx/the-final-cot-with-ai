import sys
import re

with open('components/CompareView.tsx', 'r') as f:
    content = f.read()

# Replace { opacity: 0, y: 20 } with {{ opacity: 0, y: 20 }}
content = content.replace("initial={ opacity: 0, y: 20 }", "initial={{ opacity: 0, y: 20 }}")
content = content.replace("animate={ opacity: 1, y: 0 }", "animate={{ opacity: 1, y: 0 }}")
content = re.sub(r'transition={ duration: 0.8, delay: ([0-9.]+), ease: \[0.16, 1, 0.3, 1\] }', r'transition={{ duration: 0.8, delay: \1, ease: [0.16, 1, 0.3, 1] }}', content)

with open('components/CompareView.tsx', 'w') as f:
    f.write(content)
