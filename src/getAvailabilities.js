import moment from 'moment'
import knex from 'knexClient'
const _ = require('lodash')

/**
 *
 * @param {*} startDate (Date) date start checking from
 * @param {*} numberOfDays (number) numbers of days to checking for
 * @return matched date keys for a given day on recurring events
 */

export default async function getAvailabilities (startDate, numberOfDays = 7) {
  const availabilities = new Map()
  if (numberOfDays === 0) {
    return Array.from(availabilities.values())
  }
  let numberOfWeeks = 0 // store number of weeks to use to get key
  let tmpDate
  for (let i = 0; i < numberOfDays; ++i) {
    numberOfWeeks = parseInt(i / 7)
    tmpDate = moment(startDate).add(i, 'days')
    availabilities.set((parseInt(tmpDate.format('d')) + (numberOfWeeks * 7)).toString(), {
      date: tmpDate.toDate(),
      slots: []
    })
  }
  const events = await knex
    .select('kind', 'starts_at', 'ends_at', 'weekly_recurring')
    .from('events')
    .where(function () {
      this.where('weekly_recurring', true).andWhere('starts_at', '<=', +tmpDate.endOf('day'))
    }).orWhere(function () {
      this.where('starts_at', '>=', +startDate).andWhere('ends_at', '<=', +tmpDate.endOf('day'))
    }).orWhere(function () {
      this.where('starts_at', '>=', +moment(startDate).startOf('day')).andWhere('starts_at', '<=', +tmpDate.endOf('day'))
    }).orderBy('kind', 'desc') // to add open event first then remove slots with appoinment events

  for (const event of events) {
    // checking in for loop in case of event start and end in differernt days
    for (let date = moment(event.starts_at);
      date.isBefore(event.ends_at) && (date.isBefore(tmpDate.endOf('day')) || date.isSame(tmpDate.endOf('day')));
      date.add(30, 'minutes')) {
      let day
      if (event.kind === 'opening') {
        if (event.weekly_recurring == true) {
          for (let i = 0; i <= numberOfWeeks; ++i) {
            day = availabilities.get((parseInt(date.format('d')) + (i * 7)).toString())
            if (!_.isNil(day)) {
              day.slots.push(date.format('H:mm'))
            }
          }
        }
        else {
          const key = moment(date).startOf('day').diff(moment(startDate).startOf('day'), 'days')
          day = availabilities.get(key.toString())
          if (!_.isNil(day)) {
            day.slots.push(date.format('H:mm'))
          }
        }
      } else if (event.kind === 'appointment') {
        /* get key by get different between start date and end date to avoid iteration and
         checking date of each index match current date or not */
        const key = moment(date).startOf('day').diff(moment(startDate).startOf('day'), 'days')
        day = availabilities.get(key.toString())
        if (!_.isNil(day) && moment(day.date).startOf('day').isSame(moment(date).startOf('day'))) {
          day.slots = day.slots.filter(
            slot => slot.indexOf(date.format('H:mm')) === -1
          )
        }
      }
    }
  }
  return Array.from(availabilities.values())
}
