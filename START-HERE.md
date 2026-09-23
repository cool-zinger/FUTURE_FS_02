# Run LeadNest from VS Code

1. Open this Desktop LeadNest folder in VS Code using File > Open Folder.
2. Open Terminal > New Terminal.
3. Run: .\Restart-LeadNest.cmd
4. Keep the terminal open and visit http://127.0.0.1:3000.

The restart shortcut stops the previous LeadNest Node server, starts the existing local MySQL instance if needed, builds the frontend and starts this Desktop copy.

All source files, installed dependencies, build output and local configuration were copied. Existing database data stays at the original location recorded in .local-db.json. Keep that database folder; it was not copied while running. Both installations use the same database.

Your private .env file is included for local use and ignored by Git. Gmail still needs configuration if you have not completed it: run Configure-Gmail.cmd, then Restart-LeadNest.cmd. See EMAIL-LOGIN-SETUP.md.

For a clean dependency install use npm ci. For automated tests use npm test. Stop the app with Ctrl+C.
