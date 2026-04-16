import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  unique
} from 'drizzle-orm/pg-core'
import {createInsertSchema, createSelectSchema} from 'drizzle-zod'
import { relations } from 'drizzle-orm'

// Users table - core authentication and profile
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
// Habits table - core habit definitions
export const habits = pgTable('habits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  frequency: varchar('frequency', { length: 20 }).notNull(), // daily, weekly, monthly
  targetCount: integer('target_count').default(1), // how many times per frequency
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
// Habit entries - individual completions
export const entries = pgTable('entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  habitId: uuid('habit_id')
    .references(() => habits.id, { onDelete: 'cascade' })
    .notNull(),
  completion_date: timestamp('completion_date').defaultNow().notNull(),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
// Tags table - categorization system
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(()=>users.id,{onDelete:'cascade'}).notNull(),

  name: varchar('name', { length: 50 }).notNull(),
  color: varchar('color', { length: 7 }).default('#6B7280'), // hex color
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Junction table for many-to-many relationship
export const habitTags = pgTable('habit_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  habitId: uuid('habit_id')
    .references(() => habits.id, { onDelete: 'cascade' })
    .notNull(),
  tagId: uuid('tag_id')
    .references(() => tags.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})



// Users can have many habits
export const usersRelations = relations(users, ({ many }) => ({
  habits: many(habits),
  tags: many(tags)
}))

// Habits belong to one user, have many entries and tags
export const habitsRelations = relations(habits, ({ one, many }) => ({
  user: one(users, {
    fields: [habits.userId],
    references: [users.id],
  }),
  entries: many(entries),
  habitTags: many(habitTags),
}))

// Entries belong to one habit
export const entriesRelations = relations(entries, ({ one }) => ({
  habit: one(habits, {
    fields: [entries.habitId],
    references: [habits.id],
  }),
}))

// Tags can be on many habits
export const tagsRelations = relations(tags, ({ one, many }) => ({
  habitTags: many(habitTags),
  user: one(users, {
    fields: [tags.userId],
    references: [users.id],
  }),
}))

// Junction table relations
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

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Habit = typeof habits.$inferSelect
export type Entry = typeof entries.$inferSelect
export type Tag = typeof tags.$inferSelect
export type HabitTag = typeof habitTags.$inferSelect




export const insertUserSchema = createInsertSchema(users)
export const selectUserSchema = createSelectSchema(users)