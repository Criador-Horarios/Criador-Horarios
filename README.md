# Criador de Horários

This project uses React with Typescript.

## To Run

First, install the dependencies by running `npm i`.\
Run `npm start` to start the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## TODOs

- [x] Set API type objects
- [x] Add good colors
- [X] Save state to cookies
- [X] Shorten saved state and rebuild on reload (can add loading animation)
- [X] Snackbar alerts
- [ ] Allow english or other languages
- [X] Add filters for L, T, PB, S
- [X] Course chip colors match course color
- [X] Add Github link and donation link
- [ ] Choose academic term -> missing topbar updates
- [X] Center buttons
- [X] Background Image
- [ ] Add help button/animation
- [x] Choose colors only when selecting the course
- [X] Disable clear and export schedule buttons when unable to use them

## Bug

- [ ] When exporting to image, lessons overlapping bugs
- [ ] Courses from another degree are not removed from courses list when a different degree is selected
- [X] When a shift is selected, if the course is unselected and selected again, it may have a different color

## Suggestions

- [X] Allow export image of the chosen schedule
- [ ] Allow selection of multiple degrees to have all the courses in the selection list
- [ ] Add loading progress when making request
- [X] Add checklist with chosen shifts from each course to keep track
