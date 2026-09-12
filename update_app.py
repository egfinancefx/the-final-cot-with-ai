import re

with open('App.tsx', 'r') as f:
    content = f.read()

content = content.replace('to-cyan-600', 'to-orange-500')
content = content.replace('text-cyan-400', 'text-orange-400')
content = content.replace('font-extrabold', 'font-semibold')

with open('App.tsx', 'w') as f:
    f.write(content)
