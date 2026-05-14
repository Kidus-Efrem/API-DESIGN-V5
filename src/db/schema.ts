import {
  pgTable,
  uuid,
  index,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  unique,
  date,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { relations } from 'drizzle-orm'
import { count, table } from 'console'

export const habitFrequencyEnum = pgEnum('habit_frequency', [
  'daily',
  'weekly',
  'monthly',
])

// ================= USERS =================
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 50 }),
  lastName: varchar('last_name', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ================= HABITS =================
export const habits = pgTable('habits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  frequency: habitFrequencyEnum('frequency').notNull(),
  frequencyInterval: integer('frequency_interval').default(1).notNull(),
  targetCount: integer('target_count').default(1).notNull(),
  currentStreak: integer('current_streak').default(0).notNull(),
  longestStreak:integer('longest_streak').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ================= ENTRIES =================
export const entries = pgTable('entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  habitId: uuid('habit_id')
    .references(() => habits.id, { onDelete: 'cascade' })
    .notNull(),
  completionDate: timestamp('completion_date').defaultNow().notNull(),
  note: text('note'),
  count: integer('count').notNull().default(1),
  date:timestamp('date' ,{mode: 'date'}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
},
(table)=>({
  habitDateIndex: index("entries_habit_date_idx").on(
    table.habitId,
    table.date
  )
  ,
  uniqueHabitDate: unique().on(
    table.habitId,
    table.date
  )
})

)

// ================= TAGS =================
export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 50 }).notNull(),
    color: varchar('color', { length: 7 }).default('#6B7280').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userTagUnique: unique().on(table.userId, table.name),
  })
)

// ================= HABIT TAGS =================
export const habitTags = pgTable(
  'habit_tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    habitId: uuid('habit_id')
      .references(() => habits.id, { onDelete: 'cascade' })
      .notNull(),
    tagId: uuid('tag_id')
      .references(() => tags.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueHabitTag: unique().on(table.habitId, table.tagId),
  })
)
// ========================  habit daily statas==========
export const habitDailyStats = pgTable (
  'habit_daily_stats',{
  id: uuid('id').primaryKey().defaultRandom(),
  habitId: uuid('habit_id').references(()=>habits.id, {onDelete:'cascade'}).notNull(),
  date:timestamp('date', {mode:'date'}).notNull(),
  completionCount:integer('completion_count').default(0).notNull(),
  targetCount : integer('target_count').notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp('create_at').defaultNow().notNull()
},
  (table)=>({
    uniqueHabitDailyTag: unique().on(table.habitId, table.date),
    habitDateIndex: index('habit_daily_stats_habit_date_idx').on(
      table.habitId,
      table.date
    )
  }),

)

// ========================habit reminders==========
export const habitReminders = pgTable(
  'habit_reminders',{
    id: uuid('id').primaryKey().defaultRandom(),
    habitId: uuid('habit_id').references(()=>habits.id, {onDelete: 'cascade'}).notNull(),
    timeMinutes: integer('time_minutes').notNull(),
    timeZone: varchar('time_zone', {length: 50}).notNull(),
    daysOfWeek: integer('days_of_week').array().default([]).notNull(),
    enabled:boolean('enabled').default(true).notNull(),
    frequency: habitFrequencyEnum('frequency').notNull(),
    frequencyInterval: integer('frequency_interval').default(1).notNull(),

    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull()

  },
  (table)=>({
    habitRemindersIndex: index('habit_reminder_idx').on(table.habitId , table.enabled,table.timeMinutes)
  })
)


// ================= RELATIONS =================
export const usersRelations = relations(users, ({ many }) => ({
  habits: many(habits),
  tags: many(tags),
}))

export const habitsRelations = relations(habits, ({ one, many }) => ({
  user: one(users, {
    fields: [habits.userId],
    references: [users.id],
  }),
  entries: many(entries),
  habitTags: many(habitTags),
  habitReminders: many(habitReminders),
  dailyStats: many(habitDailyStats),

}))

export const entriesRelations = relations(entries, ({ one }) => ({
  habit: one(habits, {
    fields: [entries.habitId],
    references: [habits.id],
  }),
}))

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, {
    fields: [tags.userId],
    references: [users.id],
  }),
  habitTags: many(habitTags),
}))

export const habitTagsRelations = relations(habitTags, ({ one }) => ({
  habit: one(habits, {
    fields: [habitTags.habitId],
    references: [habits.id],
  }),
  tag: one(tags, {
    fields: [habitTags.tagId],
    references: [tags.id],
  }),
}))
export const habitDailyStatsRelations = relations(habitDailyStats, ({one})=>({
  habit: one(habits, {
    fields: [habitDailyStats.habitId],
    references: [habits.id]
  })
}))
export const habitRemindersRelations = relations(
  habitReminders, ({one}) =>({
    habit: one(habits,{
      fields:[habitReminders.habitId],
      references:[habits.id]
    })
  })
)



// ================= TYPES =================
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Habit = typeof habits.$inferSelect
export type Entry = typeof entries.$inferSelect
export type Tag = typeof tags.$inferSelect
export type HabitTag = typeof habitTags.$inferSelect
export type HabitDailyStat = typeof habitDailyStats.$inferSelect
export type HabitReminder = typeof habitReminders.$inferSelect

export const insertUserSchema = createInsertSchema(users)
export const selectUserSchema = createSelectSchema(users)