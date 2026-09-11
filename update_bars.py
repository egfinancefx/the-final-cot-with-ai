import re

with open('components/CompareView.tsx', 'r') as f:
    content = f.read()

# Replace Line
line_pattern = r'(<Line\s+key=\{item\.asset\}\s+type="monotone"\s+dataKey=\{`norm_\$\{item\.index\}`\}\s+stroke=\{item\.color\}\s+strokeWidth=\{3\}\s+dot=\{false\}\s+activeDot=\{\{ r: 4, strokeWidth: 0, fill: item\.color \}\})'
line_replace = r'\1\n                          isAnimationActive={true}\n                          animationBegin={300}\n                          animationDuration={1200}\n                          animationEasing="ease-out"'
content = re.sub(line_pattern, line_replace, content)

# Replace historical Bar
bar1_pattern = r'(<Bar\s+key=\{item\.asset\}\s+dataKey=\{`asset_\$\{item\.index\}`\}\s+fill=\{item\.color\}\s+radius=\{\[4, 4, 0, 0\]\})'
bar1_replace = r'\1\n                          isAnimationActive={true}\n                          animationBegin={300}\n                          animationDuration={1200}\n                          animationEasing="ease-out"'
content = re.sub(bar1_pattern, bar1_replace, content)

# Replace longChange Bar
bar2_pattern = r'(<Bar dataKey="longChange" name="تغير الشراء \(Long Δ\)" fill="#3b82f6" radius=\{\[4, 4, 0, 0\]\})'
bar2_replace = r'\1\n                        isAnimationActive={true}\n                        animationBegin={300}\n                        animationDuration={1200}\n                        animationEasing="ease-out"'
content = re.sub(bar2_pattern, bar2_replace, content)

# Replace shortChange Bar
bar3_pattern = r'(<Bar \s*dataKey="shortChange" \s*name="تغير البيع \(Short Δ\)" \s*fill=\{isLight \? \'#64748b\' : \'#f8fafc\'\} \s*radius=\{\[4, 4, 0, 0\]\})'
bar3_replace = r'\1\n                        isAnimationActive={true}\n                        animationBegin={300}\n                        animationDuration={1200}\n                        animationEasing="ease-out"'
content = re.sub(bar3_pattern, bar3_replace, content)

with open('components/CompareView.tsx', 'w') as f:
    f.write(content)
