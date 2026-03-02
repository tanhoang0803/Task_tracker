# Task Tracker CLI

[![CI](https://github.com/tanhoang0803/Task_tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/tanhoang0803/Task_tracker/actions/workflows/ci.yml)

> GitHub: https://github.com/tanhoang0803/Task_tracker

A simple command line interface (CLI) application to track and manage your tasks.

## Overview

Task Tracker helps you manage what you need to do, what you have done, and what you are currently working on. Tasks are stored locally in a JSON file, requiring no external dependencies or databases.

## Features

- Add, update, and delete tasks
- Mark tasks as **in-progress** or **done**
- List all tasks
- Filter tasks by status: `done`, `not done`, or `in-progress`

## Usage

All interactions are done via positional command line arguments.

```bash
# Add a new task
task-cli add "Buy groceries"

# Update a task
task-cli update <id> "Buy groceries and cook dinner"

# Delete a task
task-cli delete <id>

# Mark a task as in progress
task-cli mark-in-progress <id>

# Mark a task as done
task-cli mark-done <id>

# List all tasks
task-cli list

# List tasks by status
task-cli list done
task-cli list not-done
task-cli list in-progress
```

## Task Properties

Each task stored in the JSON file contains:

| Field       | Description                              |
|-------------|------------------------------------------|
| `id`        | Unique identifier                        |
| `description` | Text description of the task           |
| `status`    | `todo`, `in-progress`, or `done`         |
| `createdAt` | Timestamp when the task was created      |
| `updatedAt` | Timestamp when the task was last updated |

## Storage

Tasks are persisted in a `tasks.json` file in the current working directory. The file is created automatically if it does not exist.

## Constraints

- No external libraries or frameworks used
- Uses only the native file system module of the chosen language
- Errors and edge cases are handled gracefully

## Project Purpose

This project is a hands-on exercise for practicing:

- CLI application design
- File system interaction
- JSON data management
- User input handling and validation
