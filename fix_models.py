import re

# Fix server.ts
with open('server.ts', 'r') as f:
    content = f.read()

content = content.replace(
    'const CANDIDATE_MODELS = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"];',
    'const CANDIDATE_MODELS = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.6-pro"];'
)

content = content.replace(
    'preferredModel: string = "gemini-3.1-flash-lite"',
    'preferredModel: string = "gemini-3.6-flash"'
)

content = content.replace(
    'const { prompt, model = "gemini-3.1-flash-lite", systemInstruction, tools, responseMimeType } = req.body;',
    'const { prompt, model = "gemini-3.6-flash", systemInstruction, tools, responseMimeType } = req.body;'
)

content = content.replace(
    'const { message, history = [], systemInstruction, model = "gemini-3.1-flash-lite" } = req.body;',
    'const { message, history = [], systemInstruction, model = "gemini-3.6-flash" } = req.body;'
)

with open('server.ts', 'w') as f:
    f.write(content)

# Fix Dashboard.tsx
with open('components/Dashboard.tsx', 'r') as f:
    dashboard = f.read()

dashboard = dashboard.replace(
    "model: 'gemini-3.1-flash',",
    "model: 'gemini-3.6-flash',"
)

dashboard = dashboard.replace(
    "model: 'gemini-3.1-flash-lite',",
    "model: 'gemini-3.6-flash',"
)

with open('components/Dashboard.tsx', 'w') as f:
    f.write(dashboard)
