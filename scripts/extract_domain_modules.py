from pathlib import Path

path = Path("src/App.tsx")
text = path.read_text()
start = text.index("// Types\n")
end = text.index("function App()")
replacement = (
    'import type { Exercise, Workout } from "./types/domain";\n'
    'import {\n'
    '  COURT_ZONES,\n'
    '  DIFFICULTY_LEVELS,\n'
    '  FOCUS_AREAS,\n'
    '  IQ_SCENARIOS,\n'
    '  PHASES,\n'
    '  PLAYBOOK_PLAYS,\n'
    '} from "./data/domain-data";\n\n'
)
path.write_text(text[:start] + replacement + text[end:])
