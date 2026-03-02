# Task Tracker — Claude Context

## Project Summary

A CLI-based task management application. Users interact via positional command line arguments. Tasks are stored in a local `tasks.json` file with no external dependencies.

## Key Requirements

- **Commands**: `add`, `update`, `delete`, `mark-in-progress`, `mark-done`, `list`
- **List filters**: all tasks, `done`, `not-done`, `in-progress`
- **Storage**: `tasks.json` in the current directory, auto-created if missing
- **No external libraries** — native file system module only
- Graceful error and edge case handling

## Task Schema

```json
{
  "id": 1,
  "description": "Task description",
  "status": "todo | in-progress | done",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

## Implementation Notes

- Use positional CLI arguments (e.g., `argv[2]` for action, `argv[3]` for id/description)
- IDs should be auto-incremented integers
- `tasks.json` must be read and written atomically to avoid data loss
- Validate inputs: missing args, invalid IDs, unknown commands
- `status` defaults to `"todo"` on task creation
