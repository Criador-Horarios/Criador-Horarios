# Criador de Horários

<p align="center">
  <a href="https://github.com/joaocmd/Criador-Horarios/commits/develop" target="_blank">
    <img src="https://img.shields.io/github/last-commit/joaocmd/Criador-Horarios" alt="GitHub last commit">
  </a>

  <a href="https://github.com/joaocmd/Criador-Horarios/blob/master/LICENSE" target="_blank">
    <img alt="LICENSE" src="https://img.shields.io/github/license/joaocmd/Criador-Horarios">
  </a>
</p>

![Demo animation](./demo/demo.gif)

<hr>

## To Run

This project uses React with Typescript.
Install the dependencies by running `npm i` and then run `npm start` to start the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Changelog
[Changelog file](./CHANGELOG.md)

## TODOs
[List of TODOs](./TODO.md)

## Bugs

- [X] When exporting to image, lessons overlapping bugs
- [ ] ~~Courses from another degree are not removed from courses list when a different degree is selected~~
- [X] When a shift is selected, if the course is unselected and selected again, it may have a different color
- [x] There were no 'Teórico-Práticas' type of shifts
- [X] When removing a course (while a shift is selected) and adding again, the chip in the timetable does not recognize the shifts selected
- [X] When a course is broken, the chip still shows and can't be removed

## Suggestions

- [X] Allow export image of the chosen schedule
- [X] Allow selection of multiple degrees to have all the courses in the selection list
- [X] Add loading progress when making request
- [X] Add checklist with chosen shifts from each course to keep track
- [X] Add titles to schedules (thanks to @Hugo-Marques-work)
- [X] Distinguish courses with I, II, etc. (i.e. CDI-I and CDI-II) (FenixEdu sets the same acronym)
- [X] Find minimum classes for enrolments
- [ ] Give option of what to add (room, campus, etc.) in excel
- [X] Add occupation on shift hover
