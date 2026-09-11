import re

with open('components/CompareView.tsx', 'r') as f:
    content = f.read()

line_pattern = r'(<Line\s+key=\{item\.asset\}\s+type="monotone"\s+dataKey=\{`norm_\$\{item\.index\}`\}\s+stroke=\{item\.color\}\s+strokeWidth=\{3\}\s+dot=\{\{ r: 5, fill: item\.color \}\}\s+activeDot=\{\{ r: 7 \}\}\s+name=\{`norm_\$\{item\.index\}`\})'
line_replace = r'\1\n                          isAnimationActive={true}\n                          animationBegin={300}\n                          animationDuration={1200}\n                          animationEasing="ease-out"'
content = re.sub(line_pattern, line_replace, content)

with open('components/CompareView.tsx', 'w') as f:
    f.write(content)
