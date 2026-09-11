import sys

with open('components/CompareView.tsx', 'r') as f:
    content = f.read()

# Add motion import
if 'import { motion } from "motion/react";' not in content:
    content = content.replace("import React,", 'import { motion } from "motion/react";\nimport React,')


def wrap_with_motion(content, start_marker, delay=0):
    idx = content.find(start_marker)
    if idx == -1: return content
    
    # We will find the next `<div` after the start_marker, and its closing `</div>`
    div_start = content.find("<div", idx)
    if div_start == -1: return content
    
    # We replace `<div` with `<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: {delay}, ease: [0.16, 1, 0.3, 1] }}`
    
    motion_div = f'<motion.div\n            initial={{ opacity: 0, y: 20 }}\n            animate={{ opacity: 1, y: 0 }}\n            transition={{ duration: 0.8, delay: {delay}, ease: [0.16, 1, 0.3, 1] }}'
    content = content[:div_start] + motion_div + content[div_start+4:]
    
    # Now we need to find the matching closing div for that div
    # simple counting of <div and </div
    count = 1
    i = div_start + len(motion_div)
    while count > 0 and i < len(content):
        next_open = content.find("<div", i)
        next_close = content.find("</div", i)
        
        if next_open != -1 and next_open < next_close:
            count += 1
            i = next_open + 4
        elif next_close != -1:
            count -= 1
            i = next_close + 5
            if count == 0:
                # We found the closing div
                content = content[:next_close] + "</motion.div" + content[next_close+5:]
                break
        else:
            break
            
    return content

# TV Charts
# content = wrap_with_motion(content, "{/* TradingView Charts Grid", 0.1)
# Wait, for TV charts, it's <div className="space-y-3"> right below it.
content = wrap_with_motion(content, "{/* TradingView Charts Grid", 0.1)

# Section 3 (Advanced Charts)
content = wrap_with_motion(content, "{/* 3. Advanced Comparison Charts Section */}", 0.2)

# Section 1 (Synthesis)
# Note: synthesis is inside `{synthesis && (`, so the `<div` is after it.
# The start marker could be `synthesis && (` or the comment.
content = wrap_with_motion(content, "{/* 1. The Core Institutional Verdict", 0.3)

# Section 2
content = wrap_with_motion(content, "{/* 2. Side-by-Side Deep Institutional", 0.4)

# Section 4
content = wrap_with_motion(content, "{/* 4. Comprehensive Comparison Matrix", 0.5)

with open('components/CompareView.tsx', 'w') as f:
    f.write(content)

print("done")
