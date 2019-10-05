import knex from 'knexClient'
import moment from 'moment'
import getAvailabilities from './getAvailabilities'
const chai = require('chai')
describe('getAvailabilities', () => {
  beforeEach(() => knex('events').truncate())

  describe('no open and appointment schedule', () => {
    it('should return empty slots with size of 10', async () => {
      const date = new Date('2014-08-10')
      const numberOfDays = 10
      const availabilities = await getAvailabilities(date, numberOfDays)
      expect(availabilities.length).toBe(numberOfDays)

      for (let i = 0; i < numberOfDays; ++i) {
        chai.expect(availabilities[0]).to.have.keys(['slots', 'date'])
        expect(availabilities[i].slots).toEqual([])
        expect(availabilities[i].date).toEqual(new Date(moment(date).add(i, 'days')))
      }
    })

    it('should return empty slots with size of 1', async () => {
      const date = new Date('2014-08-10')
      const numberOfDays = 1
      const availabilities = await getAvailabilities(date, numberOfDays)
      expect(availabilities.length).toBe(numberOfDays)

      for (let i = 0; i < numberOfDays; ++i) {
        chai.expect(availabilities[0]).to.have.keys(['slots', 'date'])
        expect(availabilities[i].slots).toEqual([])
        expect(availabilities[i].date).toEqual(new Date(moment(date).add(i, 'days')))
      }
    })

    it('should return empty slots with size of 0', async () => {
      const date = new Date('2014-08-10')
      const numberOfDays = 0
      const availabilities = await getAvailabilities(date, numberOfDays)
      expect(availabilities.length).toBe(numberOfDays)

      for (let i = 0; i < numberOfDays; ++i) {
        chai.expect(availabilities[0]).to.have.keys(['slots', 'date'])
        expect(availabilities[i].slots).toEqual([])
        expect(availabilities[i].date).toEqual(new Date(moment(date).add(i, 'days')))
      }
    })
  })

  describe('open before start date and weekly recurring & appointment between start date and end date', () => {
    beforeEach(async () => {
      await knex('events').insert([
        {
          kind: 'appointment',
          starts_at: new Date('2014-08-11 10:30'),
          ends_at: new Date('2014-08-11 11:30')
        },
        {
          kind: 'opening',
          starts_at: new Date('2014-08-04 09:30'),
          ends_at: new Date('2014-08-04 12:30'),
          weekly_recurring: true
        }
      ])
    })

    it('should return spots in 1 day', async () => {
      const numberOfDays = 7
      const date = new Date('2014-08-10')
      const availabilities = await getAvailabilities(date, numberOfDays)
      expect(availabilities.length).toBe(numberOfDays)
      for (let i = 0; i < numberOfDays; ++i) {
        chai.expect(availabilities[0]).to.have.keys(['slots', 'date'])
        expect(availabilities[i].date).toEqual(new Date(moment(date).add(i, 'days')))
      }

      expect(availabilities[0].slots).toEqual([])
      expect(availabilities[1].slots).toEqual(['9:30', '10:00', '11:30', '12:00'])
      expect(availabilities[2].slots).toEqual([])
      expect(availabilities[3].slots).toEqual([])
      expect(availabilities[4].slots).toEqual([])
      expect(availabilities[5].slots).toEqual([])
      expect(availabilities[6].slots).toEqual([])
    })
  })

  describe('open between [start date , end date] and appointment after end date', () => {
    beforeEach(async () => {
      await knex('events').insert([
        {
          kind: 'appointment',
          starts_at: new Date('2014-08-11 10:30'),
          ends_at: new Date('2014-08-11 11:30')
        },
        {
          kind: 'opening',
          starts_at: new Date('2014-08-03 09:30'),
          ends_at: new Date('2014-08-03 12:30'),
          weekly_recurring: true
        }
      ])
    })

    it('returm all opening spots', async () => {
      const availabilities = await getAvailabilities(new Date('2014-08-03'), 1)
      expect(availabilities.length).toBe(1)
      expect(String(availabilities[0].date)).toBe(String(new Date('2014-08-03')))
      expect(availabilities[0].slots).toEqual(['9:30', '10:00', '10:30', '11:00', '11:30', '12:00'])
    })
  })

  describe('opening after end date', () => {
    beforeEach(async () => {
      await knex('events').insert([
        {
          kind: 'appointment',
          starts_at: new Date('2014-08-11 10:30'),
          ends_at: new Date('2014-08-11 11:30')
        },
        {
          kind: 'appointment',
          starts_at: new Date('2014-08-17 10:30'),
          ends_at: new Date('2014-08-17 11:30')
        },
        {
          kind: 'opening',
          starts_at: new Date('2018-08-04 09:30'),
          ends_at: new Date('2018-08-04 12:30'),
          weekly_recurring: true
        }
      ])
    })

    it('return empaty spots', async () => {
      const numberOfDays = 8
      const date = new Date('2014-08-10')
      const availabilities = await getAvailabilities(date, numberOfDays)
      expect(availabilities.length).toBe(numberOfDays)
      for (let i = 0; i < numberOfDays; ++i) {
        chai.expect(availabilities[0]).to.have.keys(['slots', 'date'])
        expect(availabilities[i].slots).toEqual([])
        expect(availabilities[i].date).toEqual(new Date(moment(date).add(i, 'days')))
      }
    })
  })
  describe('opening events is not weekly recurring', () => {
    beforeEach(async () => {
      await knex('events').insert([
        {
          kind: 'appointment',
          starts_at: new Date('2014-08-10 10:30'),
          ends_at: new Date('2014-08-10 11:30')
        },
        {
          kind: 'opening',
          starts_at: new Date('2014-08-10 09:30'),
          ends_at: new Date('2014-08-10 13:30'),
          weekly_recurring: false
        }
      ])
    })

    it('should return only one day spots without recurring', async () => {
      const numberOfDays = 8
      const date = new Date('2014-08-10')
      const availabilities = await getAvailabilities(date, numberOfDays)
      expect(availabilities.length).toBe(numberOfDays)
      for (let i = 0; i < numberOfDays; ++i) {
        chai.expect(availabilities[0]).to.have.keys(['slots', 'date'])
        expect(availabilities[i].date).toEqual(new Date(moment(date).add(i, 'days')))
      }

      expect(availabilities[0].slots).toEqual(['9:30', '10:00', '11:30', '12:00', '12:30', '13:00'])
      expect(availabilities[1].slots).toEqual([])
      expect(availabilities[2].slots).toEqual([])
      expect(availabilities[3].slots).toEqual([])
      expect(availabilities[4].slots).toEqual([])
      expect(availabilities[5].slots).toEqual([])
      expect(availabilities[6].slots).toEqual([])
      expect(availabilities[7].slots).toEqual([])
    })

    it('should return empty spots', async () => {
      const numberOfDays = 8
      const date = new Date('2014-08-11')
      const availabilities = await getAvailabilities(date, numberOfDays)
      expect(availabilities.length).toBe(numberOfDays)
      for (let i = 0; i < numberOfDays; ++i) {
        chai.expect(availabilities[0]).to.have.keys(['slots', 'date'])
        expect(availabilities[i].date).toEqual(new Date(moment(date).add(i, 'days')))
      }

      expect(availabilities[0].slots).toEqual([])
      expect(availabilities[1].slots).toEqual([])
      expect(availabilities[2].slots).toEqual([])
      expect(availabilities[3].slots).toEqual([])
      expect(availabilities[4].slots).toEqual([])
      expect(availabilities[5].slots).toEqual([])
      expect(availabilities[6].slots).toEqual([])
      expect(availabilities[7].slots).toEqual([])
    })
  })

  describe('appointment event start and end on different days', () => {
    beforeEach(async () => {
      await knex('events').insert([
        {
          kind: 'appointment',
          starts_at: new Date('2014-08-10 23:30'),
          ends_at: new Date('2014-08-11 1:30')
        },
        {
          kind: 'opening',
          starts_at: new Date('2014-08-03 22:00'),
          ends_at: new Date('2014-08-04 2:30'),
          weekly_recurring: true
        }
      ])
    })

    it('should return spots in 2 days and remove appoinment spots', async () => {
      const numberOfDays = 8
      const date = new Date('2014-08-10')
      const availabilities = await getAvailabilities(date, numberOfDays)
      expect(availabilities.length).toBe(numberOfDays)
      for (let i = 0; i < numberOfDays; ++i) {
        chai.expect(availabilities[0]).to.have.keys(['slots', 'date'])
        expect(availabilities[i].date).toEqual(new Date(moment(date).add(i, 'days')))
      }

      expect(availabilities[0].slots).toEqual(['22:00', '22:30', '23:00'])
      expect(availabilities[1].slots).toEqual(['1:30', '2:00'])
      expect(availabilities[2].slots).toEqual([])
      expect(availabilities[3].slots).toEqual([])
      expect(availabilities[4].slots).toEqual([])
      expect(availabilities[5].slots).toEqual([])
      expect(availabilities[6].slots).toEqual([])
      expect(availabilities[7].slots).toEqual(['22:00', '22:30', '23:00', '23:30'])
    })

    it('should return spots in 2 days and remove appoinment spots from last day', async () => {
      const numberOfDays = 8
      const date = new Date('2014-08-03')
      const availabilities = await getAvailabilities(date, numberOfDays)
      expect(availabilities.length).toBe(numberOfDays)
      for (let i = 0; i < numberOfDays; ++i) {
        chai.expect(availabilities[0]).to.have.keys(['slots', 'date'])
        expect(availabilities[i].date).toEqual(new Date(moment(date).add(i, 'days')))
      }

      expect(availabilities[0].slots).toEqual(['22:00', '22:30', '23:00', '23:30'])
      expect(availabilities[1].slots).toEqual(['0:00', '0:30', '1:00', '1:30', '2:00'])
      expect(availabilities[2].slots).toEqual([])
      expect(availabilities[3].slots).toEqual([])
      expect(availabilities[4].slots).toEqual([])
      expect(availabilities[5].slots).toEqual([])
      expect(availabilities[6].slots).toEqual([])
      expect(availabilities[7].slots).toEqual(['22:00', '22:30', '23:00']
      )
    })
  })

  describe('opening event start and end on different days', () => {
    beforeEach(async () => {
      await knex('events').insert([
        {
          kind: 'appointment',
          starts_at: new Date('2014-08-10 22:30'),
          ends_at: new Date('2014-08-10 23:30')
        },
        {
          kind: 'opening',
          starts_at: new Date('2014-08-03 22:00'),
          ends_at: new Date('2014-08-04 2:30'),
          weekly_recurring: true
        }
      ])
    })

    it('should return slots in only one day', async () => {
      const numberOfDays = 1
      const date = new Date('2014-08-10')
      const availabilities = await getAvailabilities(date, numberOfDays)
      expect(availabilities.length).toBe(numberOfDays)
      for (let i = 0; i < numberOfDays; ++i) {
        chai.expect(availabilities[0]).to.have.keys(['slots', 'date'])
        expect(availabilities[i].date).toEqual(new Date(moment(date).add(i, 'days')))
      }

      expect(availabilities[0].slots).toEqual(['22:00', '23:30'])
    })

    it('should return slots in two days', async () => {
      const numberOfDays = 2
      const date = new Date('2014-08-10')
      const availabilities = await getAvailabilities(date, numberOfDays)
      expect(availabilities.length).toBe(numberOfDays)
      for (let i = 0; i < numberOfDays; ++i) {
        chai.expect(availabilities[0]).to.have.keys(['slots', 'date'])
        expect(availabilities[i].date).toEqual(new Date(moment(date).add(i, 'days')))
      }

      expect(availabilities[0].slots).toEqual(['22:00', '23:30'])
      expect(availabilities[1].slots).toEqual(['0:00', '0:30', '1:00', '1:30', '2:00'])
    })

    it('should return slots in 3 days', async () => {
      const numberOfDays = 8
      const date = new Date('2014-08-10')
      const availabilities = await getAvailabilities(date, numberOfDays)
      expect(availabilities.length).toBe(numberOfDays)
      for (let i = 0; i < numberOfDays; ++i) {
        chai.expect(availabilities[0]).to.have.keys(['slots', 'date'])
        expect(availabilities[i].date).toEqual(new Date(moment(date).add(i, 'days')))
      }

      expect(availabilities[0].slots).toEqual(['22:00', '23:30'])
      expect(availabilities[1].slots).toEqual(['0:00', '0:30', '1:00', '1:30', '2:00'])
      expect(availabilities[2].slots).toEqual([])
      expect(availabilities[3].slots).toEqual([])
      expect(availabilities[4].slots).toEqual([])
      expect(availabilities[5].slots).toEqual([])
      expect(availabilities[6].slots).toEqual([])
      expect(availabilities[7].slots).toEqual(['22:00', '22:30', '23:00', '23:30'])
    })
  })
})
