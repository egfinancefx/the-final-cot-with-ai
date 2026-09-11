import sys

with open('components/CompareView.tsx', 'r') as f:
    lines = f.readlines()

# Find bounds
tv_grid_end = -1
for i, line in enumerate(lines):
    if "{/* 1. The Core Institutional Verdict & Actionable Trade Synthesis Panel */}" in line:
        tv_grid_end = i
        break

sec3_start = -1
sec3_end = -1
for i, line in enumerate(lines):
    if "{/* 3. Advanced Comparison Charts Section */}" in line:
        sec3_start = i
    if "{/* 4. Comprehensive Comparison Matrix Table */}" in line:
        sec3_end = i
        break

if tv_grid_end != -1 and sec3_start != -1 and sec3_end != -1:
    section3 = lines[sec3_start:sec3_end]
    rest_before = lines[:tv_grid_end]
    rest_middle = lines[tv_grid_end:sec3_start]
    rest_after = lines[sec3_end:]
    
    new_lines = rest_before + section3 + rest_middle + rest_after
    with open('components/CompareView.tsx', 'w') as f:
        f.writelines(new_lines)
    print("Move successful")
else:
    print("Failed to find bounds")
