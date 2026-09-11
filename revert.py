import sys
import re

with open('components/CompareView.tsx', 'r') as f:
    content = f.read()

# Remove motion properties
content = re.sub(r'\s*initial={{ opacity: 0, y: 20 }}\s*animate={{ opacity: 1, y: 0 }}\s*transition={{ duration: 0.8, delay: [0-9.]+, ease: \[0.16, 1, 0.3, 1\] }}', '', content)
content = content.replace("<motion.div", "<div")
content = content.replace("</motion.div>", "</div>")

with open('components/CompareView.tsx', 'w') as f:
    f.write(content)
