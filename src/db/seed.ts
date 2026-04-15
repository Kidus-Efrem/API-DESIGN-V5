import { fileURLToPath } from 'url'
import {db} from './connections.ts'
import { users, habits, entries, tags, habitTags} from './schema.ts'

const seed = async ()=>{
	console.log('seed: Starting data base seed .......')
	try {
		console.log("clear existing data.....")

		await db.delete(entries)
		await db.delete(habitTags)
		await db.delete(habits)
		await db.delete(tags)
		await db.delete(users)


		console.log('creating demo users .....')

		const [demoUser] = await db
      .insert(users)
      .values({
        email: 'demo@habittracker.com',
        username: 'demouser',
        password: 'password',
        firstName: 'Demo',
        lastName: 'User',
      })
      .returning()

		console.log('Creating tags...')

    	const [healthTag] = await db
      .insert(tags)
      .values({ name: 'Health', color: '#10B981' })
      .returning()

	  const [productivityTag] = await db
      .insert(tags)
      .values({ name: 'Productivity', color: '#3B82F6' })
      .returning()

	  // Step 4: Create habits with relationships
    console.log('Creating demo habits...')
    const [exerciseHabit] = await db
      .insert(habits)
      .values({
        userId: demoUser.id,
        name: 'Exercise',
        description: 'Daily workout routine',
        frequency: 'daily',
        targetCount: 1,
      })
      .returning()

	  await db.insert(habitTags).values([
      { habitId: exerciseHabit.id, tagId: healthTag.id },
    ])
	 // Step 5: Create many-to-many relationships
    await db.insert(habitTags).values([
      { habitId: exerciseHabit.id, tagId: healthTag.id },
    ])

	// Step 6: Create historical completion data
    console.log('Adding completion entries...')
    const today = new Date()
    today.setHours(12, 0, 0, 0)

	for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      await db.insert(entries).values({
        habitId: exerciseHabit.id,
        completion_date: date,
        note: i === 0 ? 'Great workout today!' : null,
      })
    }

	// Step 7: Test relational queries
    console.log('\n🔍 Testing relational queries...')
    const userWithHabits = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, 'demo@habittracker.com'),
      with: {
        habits: {
          with: {
            entries: true,
            habitTags: {
              with: { tag: true },
            },
          },
        },
      },
    })

	console.log('✅ Database seeded successfully!')
    console.log('\n📊 Seed Summary:')
    console.log(`- Demo user has ${userWithHabits?.habits.length || 0} habits`)
    console.log('\n🔑 Login Credentials:')
    console.log('Email: demo@habittracker.com')
    console.log('Password: demo123')

	}
	catch(e){

	}
}

// Run seed if this file is executed directly
if (fileURLToPath(import.meta.url )=== process.argv[1]) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export default seed