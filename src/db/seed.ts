import { fileURLToPath } from 'url'

import { db } from './connections.ts'

import {
  users,
  habits,
  entries,
  tags,
  habitTags,
  habitDailyStats,
  habitReminders,
} from './schema.ts'

const seed = async () => {
  console.log(
    '🌱 Starting database seed...'
  )

  try {
    // =====================================================
    // CLEAR DATABASE
    // =====================================================

    console.log(
      '🧹 Clearing existing data...'
    )

    await db.delete(entries)

    await db.delete(habitDailyStats)

    await db.delete(habitReminders)

    await db.delete(habitTags)

    await db.delete(habits)

    await db.delete(tags)

    await db.delete(users)

    // =====================================================
    // CREATE DEMO USER
    // =====================================================

    console.log(
      '👤 Creating demo user...'
    )

    const [demoUser] = await db
      .insert(users)
      .values({
        email: 'demo@habittracker.com',

        username: 'demouser',

        password: 'demo123',

        firstName: 'Demo',

        lastName: 'User',
      })
      .returning()

    // =====================================================
    // CREATE TAGS
    // =====================================================

    console.log('🏷️ Creating tags...')

    const [healthTag] = await db
      .insert(tags)
      .values({
        userId: demoUser.id,

        name: 'Health',

        color: '#10B981',
      })
      .returning()

    const [productivityTag] = await db
      .insert(tags)
      .values({
        userId: demoUser.id,

        name: 'Productivity',

        color: '#3B82F6',
      })
      .returning()

    // =====================================================
    // CREATE HABITS
    // =====================================================

    console.log(
      '🎯 Creating habits...'
    )

    const [exerciseHabit] = await db
      .insert(habits)
      .values({
        userId: demoUser.id,

        name: 'Exercise',

        description:
          'Daily workout routine',

        frequency: 'daily',

        frequencyInterval: 1,

        targetCount: 1,

        currentStreak: 5,

        longestStreak: 8,
      })
      .returning()

    const [studyHabit] = await db
      .insert(habits)
      .values({
        userId: demoUser.id,

        name: 'Study',

        description:
          'Study algorithms daily',

        frequency: 'daily',

        frequencyInterval: 1,

        targetCount: 2,

        currentStreak: 3,

        longestStreak: 6,
      })
      .returning()

    // =====================================================
    // HABIT TAG RELATIONSHIPS
    // =====================================================

    console.log(
      '🔗 Creating habit-tag relationships...'
    )

    await db.insert(habitTags).values([
      {
        habitId: exerciseHabit.id,
        tagId: healthTag.id,
      },

      {
        habitId: studyHabit.id,
        tagId: productivityTag.id,
      },
    ])

    // =====================================================
    // CREATE REMINDERS
    // =====================================================

    console.log(
      '⏰ Creating reminders...'
    )

    await db.insert(habitReminders).values([
      {
        habitId: exerciseHabit.id,

        timeMinutes: 7 * 60,

        timeZone: 'Africa/Addis_Ababa',

        daysOfWeek: [1, 2, 3, 4, 5],

        frequency: 'daily',

        frequencyInterval: 1,
      },

      {
        habitId: studyHabit.id,

        timeMinutes: 20 * 60,

        timeZone: 'Africa/Addis_Ababa',

        daysOfWeek: [1, 2, 3, 4, 5, 6],

        frequency: 'daily',

        frequencyInterval: 1,
      },
    ])

    // =====================================================
    // CREATE ENTRIES + DAILY STATS
    // =====================================================

    console.log(
      '📈 Creating entries and stats...'
    )

    const today = new Date()

    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 7; i++) {
      const date = new Date(today)

      date.setDate(
        date.getDate() - i
      )

      // Exercise entry
      await db.insert(entries).values({
        habitId: exerciseHabit.id,

        date,

        completionDate: new Date(
          date.getTime() +
            1000 * 60 * 60 * 7
        ),

        count: 1,

        note:
          i === 0
            ? 'Great workout today!'
            : null,
      })

      // Exercise daily stat
      await db
        .insert(habitDailyStats)
        .values({
          habitId: exerciseHabit.id,

          date,

          completionCount: 1,

          targetCount: 1,
        })

      // Study habit entry
      await db.insert(entries).values({
        habitId: studyHabit.id,

        date,

        completionDate: new Date(
          date.getTime() +
            1000 * 60 * 60 * 20
        ),

        count: 2,

        note:
          i === 0
            ? 'Solved graph problems'
            : null,
      })

      // Study daily stat
      await db
        .insert(habitDailyStats)
        .values({
          habitId: studyHabit.id,

          date,

          completionCount: 2,

          targetCount: 2,
        })
    }

    // =====================================================
    // TEST RELATIONAL QUERIES
    // =====================================================

    console.log(
      '🧪 Testing relational queries...'
    )

    const userWithHabits =
      await db.query.users.findFirst({
        where: (users, { eq }) =>
          eq(
            users.email,
            'demo@habittracker.com'
          ),

        with: {
          habits: {
            with: {
              entries: true,

              dailyStats: true,

              habitReminders: true,

              habitTags: {
                with: {
                  tag: true,
                },
              },
            },
          },

          tags: true,
        },
      })

    // =====================================================
    // SUMMARY
    // =====================================================

    console.log(
      '\n✅ Database seeded successfully!'
    )

    console.log('\n📊 Seed Summary')

    console.log(
      `👤 User: ${demoUser.email}`
    )

    console.log(
      `🎯 Habits: ${
        userWithHabits?.habits.length || 0
      }`
    )

    console.log(
      `🏷️ Tags: ${
        userWithHabits?.tags.length || 0
      }`
    )

    console.log(
      '\n🔑 Demo Login'
    )

    console.log(
      'Email: demo@habittracker.com'
    )

    console.log(
      'Password: demo123'
    )
  } catch (e) {
    console.error(
      '❌ Seed failed:',
      e
    )

    throw e
  }
}

// =====================================================
// RUN DIRECTLY
// =====================================================

if (
  fileURLToPath(import.meta.url) ===
  process.argv[1]
) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)

      process.exit(1)
    })
}

export default seed