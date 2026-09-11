import sys

with open('components/CompareView.tsx', 'r') as f:
    lines = f.readlines()
    
# Let's write a simple script to clean it up and ensure proper <AnimatePresence> and <motion.div>s

with open('components/CompareView.tsx', 'w') as f:
    in_chart_body = False
    for line in lines:
        if "AnimatePresence" in line and "<AnimatePresence mode" not in line:
            # skip broken animate presence tags
            continue
            
        if '<div className="h-[380px] w-full">' in line:
            f.write(line)
            f.write('            <AnimatePresence mode="wait">\n')
            in_chart_body = True
            continue
            
        if in_chart_body and "</div>" in line and "          </div>" in line: # End of chart body
            f.write('            </AnimatePresence>\n')
            f.write(line)
            in_chart_body = False
            continue
            
        # Replace div with motion.div for the 4 charts
        if "chartView === 'normalized' && (" in line:
            f.write(line)
            continue
        if "chartView === 'historical' && (" in line:
            f.write(line)
            continue
        if "chartView === 'delta' && (" in line:
            f.write(line)
            continue
        
        # we need to make sure the end tags match.
        # It's a mess, I'll just write a cleaner script to do a regex replace over the whole string.
        f.write(line)
