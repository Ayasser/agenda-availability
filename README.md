# agenda-availability
Checking Agenda availability based on open or appointment events
## Instructions
The code provides an algorithm that checks the availabilities of an agenda depending of
the events attached to it. The main method has a start date for input and is looking for
the availabilities of the next N days.

They are two kinds of events:
 * `opening`, are the openings for a specific day and they can be recurring week by week.
 * `appointment`, times when the doctor is already booked.

### How to run
 * Install [node](https://nodejs.org/en/) and [yarn](https://yarnpkg.com/en/)
 * Run `yarn && yarn test`, focus on `src` folder, you are ready!
