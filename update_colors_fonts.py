import re

with open('components/CompareView.tsx', 'r') as f:
    content = f.read()

# 1. Fonts
content = content.replace('font-black', 'font-semibold')
content = content.replace('font-bold', 'font-medium')

# 2. Colors
# Replace text-cyan-300 with text-white
content = content.replace('text-cyan-300', 'text-white')
content = content.replace('text-cyan-400', 'text-white')
# if it was 'bg-cyan-300' replace with bg-orange-400 or blue etc.
content = content.replace('text-blue-200/70', 'text-slate-300') # Subtext in dark mode
content = content.replace('text-blue-200', 'text-white')

# Also, there's `isLight ? 'text-blue-600' : 'text-cyan-300'`
# now it will become `isLight ? 'text-blue-600' : 'text-white'` which is fine.

# What about the third color as orange?
# "ولو فيه لون تالت يكون برتقالى مثلا" - And if there's a third color, make it orange.
# Let's see if there are any specific highlights we can make orange.
# `text-blue-400` -> `text-orange-400` for some labels?
# Let's find some cyan backgrounds.
content = content.replace('bg-cyan-900', 'bg-blue-900')
content = content.replace('bg-cyan-800', 'bg-blue-800')

with open('components/CompareView.tsx', 'w') as f:
    f.write(content)
