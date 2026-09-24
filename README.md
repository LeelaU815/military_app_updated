# military_app_updated
this is our app so far

## where stuff is
everything lives in `front_end/pcs-compass` (expo app)
- `App.js` - navigation (stack + bottom tabs)
- `*Screen.js` - the screens
- `data.js` - bases, disability categories, areas, schools, providers, contacts, checklists (every entry has a `source` link)
- `constants.js` - dropdown options + helpers shared by the profile wizard, profile screen, and dashboard
- `theme.js` - app colors
- `storage.js` - all the AsyncStorage stuff (users, current user, profiles)
- `scoring.js` - area scoring (not done yet)
- `components/` - date picker, drag to rank list, and the shared form controls (ChoiceRow, ScaleSelector, Dropdown)

to run: `cd front_end/pcs-compass && npm install && npm start`
