import sys

with open('components/CompareView.tsx', 'r') as f:
    lines = f.readlines()

if 'import { motion } from "motion/react";\n' not in lines[0] and 'import { motion }' not in lines[1]:
    lines.insert(0, 'import { motion } from "motion/react";\n')

def find_line(lines, substr):
    for i, line in enumerate(lines):
        if substr in line:
            return i
    return -1

tv_start = find_line(lines, "{/* TradingView Charts Grid")
sec3_start = find_line(lines, "{/* 3. Advanced Comparison Charts Section */}")
sec1_start = find_line(lines, "{/* 1. The Core Institutional Verdict")
sec2_start = find_line(lines, "{/* 2. Side-by-Side Deep Institutional")
sec4_start = find_line(lines, "{/* 4. Comprehensive Comparison Matrix")

# TV Block
lines.insert(sec3_start, '        </motion.div>\n')
lines.insert(tv_start, '        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>\n')

# The indices have shifted! We must re-find them.
tv_start = find_line(lines, "{/* TradingView Charts Grid")
sec3_start = find_line(lines, "{/* 3. Advanced Comparison Charts Section */}")
sec1_start = find_line(lines, "{/* 1. The Core Institutional Verdict")
sec2_start = find_line(lines, "{/* 2. Side-by-Side Deep Institutional")
sec4_start = find_line(lines, "{/* 4. Comprehensive Comparison Matrix")

lines.insert(sec1_start, '        </motion.div>\n')
lines.insert(sec3_start, '        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}>\n')

sec1_start = find_line(lines, "{/* 1. The Core Institutional Verdict")
sec2_start = find_line(lines, "{/* 2. Side-by-Side Deep Institutional")
sec4_start = find_line(lines, "{/* 4. Comprehensive Comparison Matrix")

lines.insert(sec2_start, '        </motion.div>\n')
lines.insert(sec1_start, '        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}>\n')

sec2_start = find_line(lines, "{/* 2. Side-by-Side Deep Institutional")
sec4_start = find_line(lines, "{/* 4. Comprehensive Comparison Matrix")

lines.insert(sec4_start, '        </motion.div>\n')
lines.insert(sec2_start, '        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}>\n')

sec4_start = find_line(lines, "{/* 4. Comprehensive Comparison Matrix")
# For section 4, we wrap until the end of the container. 
# Let's find `          </div>` right before `        </div>` that closes the space-y-8 container.
end_idx = -1
for i in range(len(lines)-1, -1, -1):
    if "export default CompareView;" in lines[i]:
        # go up to find the divs
        # 1284                ))}
        # 1285              </tbody>
        # 1286            </table>
        # 1287          </div>
        # 1288        </div>
        # 1289      </div>
        # 1290    </div>
        # We want to insert after 1288 (the `</div>` that closes Section 4, which is at the same indent as `<div className={'rounded-3xl border shadow-xl'}`)
        break

# Let's just find the `</div>` with exact 8 spaces indent after sec4_start
for i in range(sec4_start+1, len(lines)):
    if lines[i].startswith('        </div>'):
        lines.insert(i+1, '        </motion.div>\n')
        break

lines.insert(sec4_start, '        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}>\n')

with open('components/CompareView.tsx', 'w') as f:
    f.writelines(lines)
