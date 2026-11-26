# Registration Portal — Frontend

Plain HTML, CSS and JavaScript. No build step or npm needed.

## Run it

Start the backend first (see `../backend/README.md`), then:

```bash
cd registration-portal/frontend
python -m http.server 5500
```

Open http://127.0.0.1:5500. (VS Code's Live Server extension also uses port 5500.)
If you serve it from another address, add that address to `CORS_ORIGINS` in the backend `.env`.

## Settings

`js/config.js`:

- `API_BASE_URL`: where the backend runs (default `http://127.0.0.1:8000`).
- `AFTER_LOGIN_URL`: page opened after login/sign-up. It's `welcome.html` (a placeholder) for
  now; point it at the Home Page frontend when that's built.

## Pages

- `index.html`: log in with username + password, with a link to sign up.
- `signup.html`: name, username, email, college, password + confirm.
  - Username availability is checked live as you type.
  - Password checklist ticks off each rule (8+ chars, upper, lower, number, symbol).
  - College is a searchable list (NIRF colleges first, with their rank). If it's missing,
    **Add it** opens a small form (name, city, state) that saves it for future students.
- `welcome.html`: temporary page after login that shows the signed-in user and a log-out button.

## Files

```
css/styles.css     all styling (colours at the top)
js/config.js       settings
js/api.js          calls to the backend + stores the login token
js/ui.js           shared helpers (errors, loading buttons, show/hide password)
js/validation.js   same rules as the backend, for instant feedback
js/login.js        login page logic
js/signup.js       sign-up page logic (incl. college search and "add college")
```

The login token is kept in `localStorage` and sent as `Authorization: Bearer <token>`.
Later pages can use `Api.me()` and `Api.Session` from `js/api.js` to check who's logged in.
