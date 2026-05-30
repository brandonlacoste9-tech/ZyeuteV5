# How to debug the backend (3 steps)

1. **Start the debugger**  
   Press **F5** (or Run → Start Debugging).  
   The backend will start and you’ll see logs in the terminal. Leave it running.

2. **Set one breakpoint**  
   Open `backend/routes/health.ts`, click in the **left gutter** (next to the line numbers) on **line 6** so a red dot appears.

3. **Trigger it**  
   In your browser, go to: **http://localhost:3000/api/health**  
   The debugger will pause on that line. You can look at variables and press **F5** to continue.

That’s it. Use the same idea for other files: set a red dot where you want to pause, then do something in the app that hits that code.
