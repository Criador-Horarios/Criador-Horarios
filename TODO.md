## TODOs

- [x] Set API type objects
- [x] Add good colors
- [X] Save state to cookies
- [X] Shorten saved state and rebuild on reload (can add loading animation)
- [X] Snackbar alerts
- [X] Allow english (missing other languages)
- [X] Add filters for L, T, PB, S
- [X] Course chip colors match course color
- [X] Add Github link and donation link
- [X] Choose academic term (currently disabled)
- [X] Center buttons
- [X] Background Image
- [X] Add help button/animation
- [x] Choose colors only when selecting the course
- [X] Disable clear and export schedule buttons when unable to use them
- [X] When building, show maintenance page (downtime is almost 0)
- [ ] ~~Add tooltip to filter buttons~~
- [X] Export schedule to excel
- [X] Add english version to schedule excel
- [X] Webscrape classes for the selected shifts
- [X] Use sheetjs to create excel files without warning
- [X] Increase contrast on selected and selected shifts on checklist
- [X] Add button and dialog with functionality news
- [X] Add warning telling that there maybe shifts from another degree that is not yours
- [X] Define semester and current year automatically
- [X] Add calendar file with shifts
- [X] Allow selection of multiple degrees to have all the courses in the selection list
- [X] Algorithm for minimum classes for enrolments
- [ ] Watch out for a possible problem with the degree acronyms
- [X] Fetch degrees of selected courses and shifts when coming from cookies
- [ ] ~~Add 'real-time' shift occupation~~ Not done for now, since it can break fenix?
- [ ] Give option of what to add (room, campus, etc.) in excel
- [ ] Refactor methods to decrease complexity
- [X] AGISIT has shifts with different names -> As we store T01 only and there are 2, we show them both :(
- [X] Store picked color of courses (cookies)
- [X] Change font color according to background color [help](https://stackoverflow.com/questions/3942878/how-to-decide-font-color-in-white-or-black-depending-on-background-color)
- [ ] Get the classes with the schedules to show only the shifts with the selected degrees
- [X] Show warning when there are no selected degrees and tries to get classes
- [ ] Requests cache and bypass?
- [ ] Finalize occupancy shift updater and set it for all available shifts for the selected courses
- [X] Store selected academic term and use it
- [ ] Fix download dropdown to not use a dialog but a focus grab


Multiple-Timetables (Important):
- [X] Single line of colors for all timetables
- [X] When choosing BD multiple times it starts to not replace the old ones
- [X] Add a storage of the existing courses to avoid asking new ones
- [X] Allow multishift (and store it)
- [X] Set academic term in timetable, as we should be able to store timetables from different semesters
- [X] Allow sharing the timetable with the URL
- [X] Remove stored states not necessary anymore
- [X] Test if there are errors and how they are displayed when parsing a timetable
- [X] Delete button for timetables
- [X] Fix adding timetables not showing the correct text
- [X] Add on autocomplete button to add new timetable
- [X] When merged, change domain back to horarios.dang.pt
- [X] Fix duplicating schedule
- [X] When duplicating the timetable name is ignored for duplication
- [X] Store degrees, courses and shifts to avoid repeating requests and use references for all timetables
- [ ] Remove all real shifts from Timetable and use references
- [X] Allow usage of "enter" and "escape" buttons for control of the timetables creation
- [ ] Order timetables by semesters and divide them with a divider
- [ ] New timetable should use the semester of the current selected timetable


Good to do but not important
- [ ] Store course color for consistent usage
- [ ] Don't load all timetables at once, only load the first one and then the ones used (lazy load)
- [X] Academic terms are being loaded way too much!
- [X] Mechanism to wait for existing requests that are going to be duplicated (same course multiple times) (related to above)
- [ ] Allow editing timetables' name
- [ ] Implement forceUpdate on timetable fetching