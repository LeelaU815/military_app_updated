# PCS Compass
an iPad/iPhone app for military families who have a kid with special needs and are getting ready for a PCS move.
you make a family profile, and the app ranks schools and providers for your kid, builds your move checklist, and keeps your dates, contacts, and paperwork in one place.

right now **Naval Station Norfolk** is the only base with full data. every school, provider, contact, task, and school date in the app is real and has a `source` link to where it came from -- no fake data.

## what's in the app
- **Home** -- PCS countdown, a "next up" banner (next task + today's/tomorrow's appointment), quick access tiles, your kid's overview
- **Map** -- schools, pediatric specialists, therapists, respite care, and military facilities on Apple Maps, ranked for your kid (TOPSIS scoring: fit, cost, proximity, distance from home). "for my kid" vs "show all", choose places to add them to your list
- **Tasks** -- pre-move / arrival / onboarding checklists with EFMP, school, medical, and moving tasks, due dates from your PCS date, tasks for each place you chose, your own tasks. sections fold up
- **Docs** -- save photos and PDFs (IEP, orders, immunization records...) in folders, view them, share them. saved only on the device, nothing is uploaded
- **Calendar** -- month view with the PCS date, task due dates, your appointments, and school year dates from the district calendars. add appointments to the iPad's Calendar app
- **Contacts** -- places you chose, verified base and TRICARE contacts, your own contacts. tap to call, email, or get directions
- **Alerts** -- overdue, due this week, and coming up, plus real reminders on the device (you pick the time) and a badge on the tab

## where stuff is
everything lives in `front_end/pcs-compass` (expo app)
- `App.js` - navigation (stack + bottom tabs), notification taps, the alerts badge
- `*Screen.js` - the screens (the `*EditorScreen.js`, `*DetailsScreen.js` and `*ViewerScreen.js` ones slide up as modals)
- `data.js` - bases, disability categories, areas, schools, providers, contacts, checklist tasks, document name suggestions, school year dates (every entry has a `source` link)
- `constants.js` - dropdown options + helpers shared by the profile wizard, profile screen, and dashboard
- `theme.js` - app colors + stage colors
- `storage.js` - all the Firebase stuff (accounts, profiles, chosen places, checklist progress, contacts, appointments)
- `firebaseConfig.js` - connects to Firebase using the keys in `.env`
- `firestore.rules` - database security rules (each family can only see their own stuff)
- `scoring.js` - TOPSIS ranking for the map
- `geocode.js` - turns the home address into map coordinates (U.S. Census geocoder, free, no key)
- `checklists.js` - builds the task list from `data.js`, the profile, and chosen places
- `calendar.js` - builds what shows on each calendar day
- `contacts.js` - builds the contacts list
- `alerts.js` - builds the alerts and the reminder schedule
- `reminders.js` - keeps the alerts badge and scheduled reminders up to date, notification settings
- `notifications.js` - talks to expo-notifications (local reminders only, no push server)
- `deviceCalendar.js` - adds events to the iPad's Calendar app
- `documentStore.js` - saves documents on the device
- `components/` - shared controls (ChoiceRow, SegmentedControl, ScaleSelector, Dropdown, date/time/duration wheels, ranking list with up/down arrows, account button, login/sign up layout)
- `plugins/withoutPushEntitlement.js` - lets a free Apple account sign the app (we don't use push notifications)
- `assets/` - app icon and splash screen

## firebase setup (one time)
1. in the Firebase console, open the project and add a **Web app** (Project settings > General > Your apps)
2. Authentication > Sign-in method > turn on **Email/Password**
3. Firestore Database > create database, then paste `firestore.rules` into the Rules tab and publish
4. copy `front_end/pcs-compass/.env.example` to `.env` and fill in the keys from the web app config (`.env` is never committed)

## run it in Expo Go (Windows or Mac)
```
cd front_end/pcs-compass
npm install
npx expo start -c
```
then scan the QR code with Expo Go on the iPad. to show someone on another network, use `npx expo start --tunnel`.

if you pull new code and it complains about a missing package, run `npm install` again.

## put it on the iPad as its own app (Mac + free Apple ID)
one time:
1. install Xcode from the App Store (with the iOS component), open it, and add your Apple ID in Xcode > Settings > Apple Accounts
2. on the iPad: Settings > Privacy & Security > Developer Mode > on
3. `brew install node cocoapods`, clone the repo, and copy your `.env` into `front_end/pcs-compass`

to put the newest version on the iPad (plug it in first):
```
cd front_end/pcs-compass
npm install
npx expo run:ios --device --configuration Release
```
if `app.json` changed or a new package was added, rebuild the iOS project first:
```
npx expo prebuild --platform ios --clean
open ios/*.xcworkspace
```
then in Xcode: Signing & Capabilities > Team > your Personal Team, and run the `run:ios` command above.
- if the Mac asks for a keychain password for "codesign", it's the Mac's login password. click **Always Allow**
- if the iPad says Untrusted Developer: Settings > General > VPN & Device Management > Trust
- with a free Apple ID the app stops opening after 7 days. plug in and run the `run:ios` command again (your data stays)
- `ios/` and `android/` are made by these commands from `app.json`, so they're not in git

## what's next
see `TODO.md`
