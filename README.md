# military_app_updated
this is our app so far

## where stuff is
everything lives in `front_end/pcs-compass` (expo app)
- `App.js` - navigation (stack + bottom tabs)
- `*Screen.js` - the screens
- `data.js` - bases, disability categories, areas, schools, providers, contacts, checklists (every entry has a `source` link)
- `constants.js` - dropdown options + helpers shared by the profile wizard, profile screen, and dashboard
- `theme.js` - app colors
- `storage.js` - all the Firebase stuff (sign up, log in, log out, load/save profiles)
- `firebaseConfig.js` - connects to Firebase using the keys in `.env`
- `firestore.rules` - database security rules (each family can only see their own profile)
- `scoring.js` - area scoring (not done yet)
- `components/` - date picker, drag to rank list, and the shared form controls (ChoiceRow, ScaleSelector, Dropdown)

## firebase setup (one time)
1. in the Firebase console, open the project and add a **Web app** (Project settings > General > Your apps)
2. Authentication > Sign-in method > turn on **Email/Password**
3. Firestore Database > create database, then paste `firestore.rules` into the Rules tab and publish
4. copy `front_end/pcs-compass/.env.example` to `.env` and fill in the keys from the web app config

to run: `cd front_end/pcs-compass && npm install && npm start`
