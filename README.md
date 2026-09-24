# military_app_updated
this is our app so far

## where stuff is
everything lives in `front_end/pcs-compass` (expo app)
- `App.js` - navigation (stack + bottom tabs)
- `*Screen.js` - the screens
- `data.js` - bases, disability categories, areas, schools, providers, checklists
- `constants.js` - dropdown options shared by the profile wizard, profile screen, and dashboard
- `storage.js` - all the AsyncStorage stuff (users, current user, profiles)
- `scoring.js` - area scoring (not done yet)
- `components/` - date picker + drag to rank list

to run: `cd front_end/pcs-compass && npm install && npm start`
