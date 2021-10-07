# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Menu that aggregates all download buttons

### Fixed

- Excel padding cells not formatted

### Removed

## [1.10.4]

### Added

### Fixed

- Shift scraper not working with degrees that have numbers in acronym

### Removed

## [1.10.3]

### Added

### Fixed

- Not being able to fetch some classes for some shifts

### Removed

## [1.10.2] - 09/09/2021

### Added

### Fixed

- Shift types were wrong

### Removed

## [1.10.1] - 09/09/2021

### Added

### Fixed

- Errors in parsing crashed the state restoring, it now warns the user and keeps parsing
- When a course was not well parsed, every shift type was shown, now none is shown
- Fixed P shifts breaking TP shifts

### Removed

## [1.10.0] - 09/09/2021

### Added

- Store colors in LocalStorage

### Fixed

- Store degrees in LocalStorage
- Missing shift type (P)

### Removed

## [1.9.2] - 08/09/2021

### Added

### Fixed

- Wrong shift id

### Removed

## [1.9.1] - 08/09/2021

### Added

### Fixed

- Refactor saved state logic to its own module
- Refactor react styles to its own module
- Stop fetching degrees twice
- Keep courses and shifts on language change
- Duplicate shifts showing up on reload or on URL

### Removed

## [1.9.0] - 07/09/2021

### Added

### Fixed

- Use /degrees/all endpoint
- Update degrees on academicTerm change

### Removed

## [1.8.0] - 04/09/2021

### Added

- Add color picker (with its own component) in schedule chip to change course color

### Fixed

### Removed

## [1.7.0] - 02/09/2021

### Added

- Settings dialog to change semester (hidden for now)

### Fixed

- Remove courses that can't be obtained
- Degrees had not been fetched with the updated academic term

### Removed

## [1.6.0] - 28/06/2021

### Added

- Allow selection of multiple degrees to have all the courses in the selection list
- Allow storing degrees in cookies and urls for sharing and showing proper classes
- Add minimal classes functionality when getting the classes

### Fixed

- Add temporary favicon.ico
- When unselecting a course that has one or more shifts selected and then selecting again, the chips do not mark as selected the corresponding shifts

## [1.5.0] - 02/03/2021

### Added

- Allow download of calendar with the selected shifts
- Add dialog with changelog

### Fixed

- React-scripts (immer) vulnerability
- Excel file without filename

## [1.4.0] - 01/03/2021

### Added

- Automatic academic term selection
- Tooltip with occupation of the shift (on event hover)
- Warning of occupation data not in real time
- CTRL + Click on shift to access course page

### Fixed

- Fix schedule saving image with unusual scroll

## [1.3.0] - 22/02/2021

### Added 

- Save schedule and classes in an Excel file
- New way of saving images
- Schedule saving as image for dark mode
- Add warning of possible shifts with unwanted degrees

### Fixed

- Date not parsed in Safari
- Shifts without classes would stop the application
- Image saving would give blank lessons if overlaping
- Not enough contrast in shifts checklist

## [1.2.0] - 14/02/2021

### Added

- Dark mode
- Get classes by shift for enrolments
- Store dark mode and language selection in cookies

### Fixed 

- Shifts without campus were showing 'undefined' campus

## [1.1.0] - 14/02/2021

### Added

- English translation

## [1.0.0] - 12/02/2021

### Added

- Obtain degrees and courses from Fenix API
- Allow selection of degrees and courses
- Obtain corresponding shifts for selected courses
- Allow selection of shifts
- Allow saving the schedule as image
- Clearing of schedule
- Checklist for selected shift types for each course
- Filter buttons for shift type
- Sharing link
- Storing selected shifts in cookies
- Help button
- Support, authors and repository links