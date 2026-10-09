# to do

## next up
- [x] scoring: TOPSIS ranking of schools and providers (fixed ideal, grade filter, "for my kid" filter)
- [x] scoring: look up the home address's coordinates when the profile is saved (U.S. Census geocoder) so "distance from house" works
- [x] map & discovery screen (map pins, type tabs, "for my kid" vs "show all" toggle, details)
- [x] "choose this location" on the map (card + details page), saved to users/{uid}/savedLocations
- [x] account button on home (profile + log out)
- [x] apple-style look for the rest of the app (home, profile wizard, profile, login/sign up) + 7 tabs
- [x] checklists (pre-move / arrival / onboarding + EFMP tasks, due dates from PCS date, custom tasks), saved to users/{uid}/checklistProgress
- [x] chosen locations create tasks
- [x] chosen locations show up in contacts
- [x] contacts screen (verified contacts + chosen places + custom contacts, tap to call, more resources)
- [ ] calendar + alerts (PCS date and EFMP deadlines, color-coded by urgency)
- [ ] documents checklist (what to gather: IEP, DD 2792, etc.)

## later
- [ ] reviews from other families (ratings + wait times) -- could use the existing `reports` collection pattern
- [ ] real quality data: Virginia school accreditation, CMS hospital star ratings
- [ ] google places api (address autocomplete, more places, ratings) -- needs billing + a locked-down key
- [ ] document uploads (firebase storage, may need billing)
- [ ] data for the other 7 bases
- [ ] before android release: free google maps api key (iOS uses apple maps, no key)
