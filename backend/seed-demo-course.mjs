import mongoose from 'mongoose'
import { randomUUID } from 'node:crypto'
import process from 'node:process'

process.loadEnvFile?.('.env.local')

const mongoUri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB

if (!mongoUri) {
  throw new Error('MONGODB_URI is required')
}

const lessonSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    videoUrl: { type: String, default: null },
    duration: { type: Number, default: 0 },
    isPreview: { type: Boolean, default: false },
  },
  { _id: false },
)

const sectionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    lessons: { type: [lessonSchema], default: [] },
  },
  { _id: false },
)

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: null },
    thumbnail: { type: String, default: null },
    category: { type: String, default: null },
    level: { type: String, default: 'beginner' },
    instructor: { type: String, default: null },
    price: { type: Number, default: 0 },
    originalPrice: { type: Number, default: null },
    duration: { type: Number, default: 0 },
    studentsCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    status: { type: String, enum: ['DRAFT', 'PUBLISHED'], default: 'DRAFT' },
    sections: { type: [sectionSchema], default: [] },
  },
  {
    collection: 'courses',
    timestamps: true,
    versionKey: false,
  },
)

const Course = mongoose.models.Course ?? mongoose.model('Course', courseSchema)

function isDuplicateKeyError(error) {
  return Boolean(error && typeof error === 'object' && error.code === 11000)
}

async function upsertCourseBySlug(course) {
  try {
    await Course.updateOne(
      { slug: course.slug },
      {
        $set: course,
      },
      { upsert: true },
    )
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error
    }

    await Course.updateOne(
      { slug: course.slug },
      {
        $set: course,
      },
    )
  }
}

function makeLesson(title, duration, isPreview = false) {
  return {
    id: randomUUID(),
    title,
    videoUrl: isPreview ? `https://example.com/preview/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : null,
    duration,
    isPreview,
  }
}

function makeSection(title, lessons) {
  return {
    id: randomUUID(),
    title,
    lessons,
  }
}

function withDuration(course) {
  const duration = course.sections.flatMap((section) => section.lessons).reduce((sum, lesson) => sum + lesson.duration, 0)
  return { ...course, duration }
}

const courses = [
  withDuration({
    title: 'React Learning Platform Starter',
    slug: 'react-learning-platform-starter',
    description: 'A demo published course for testing Home, Courses, Course Detail, Checkout, and Learn flows.',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',
    category: 'Frontend',
    level: 'beginner',
    instructor: 'EduLearn Team',
    price: 29,
    originalPrice: 49,
    studentsCount: 0,
    rating: 5,
    reviewsCount: 12,
    status: 'PUBLISHED',
    sections: [
      makeSection('Welcome and setup', [
        makeLesson('How this learning platform works', 8, true),
        makeLesson('Project structure overview', 12),
      ]),
      makeSection('Core product flow', [
        makeLesson('Course browsing and detail screens', 14, true),
        makeLesson('Checkout and progress tracking', 18),
      ]),
    ],
  }),
  withDuration({
    title: 'Authentication UI with Real Backend',
    slug: 'authentication-ui-with-real-backend',
    description: 'Build login, register, forgot password, and change password flows with clear API states.',
    thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c',
    category: 'Auth',
    level: 'intermediate',
    instructor: 'Mai Nguyen',
    price: 35,
    originalPrice: 59,
    studentsCount: 18,
    rating: 4.9,
    reviewsCount: 21,
    status: 'PUBLISHED',
    sections: [
      makeSection('Auth foundation', [
        makeLesson('JWT flow explained', 10, true),
        makeLesson('Client side auth store', 15),
      ]),
      makeSection('Recovery and security', [
        makeLesson('Forgot password flow', 11, true),
        makeLesson('Change password and token revoke', 13),
      ]),
    ],
  }),
  withDuration({
    title: 'Course Catalog and Filter Experience',
    slug: 'course-catalog-and-filter-experience',
    description: 'Create a polished course listing page with search, category pills, sorting, and reusable cards.',
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
    category: 'Catalog',
    level: 'beginner',
    instructor: 'Lan Tran',
    price: 24,
    originalPrice: 39,
    studentsCount: 34,
    rating: 4.8,
    reviewsCount: 16,
    status: 'PUBLISHED',
    sections: [
      makeSection('Listing UX', [
        makeLesson('Search and category layout', 9, true),
        makeLesson('Card grid consistency', 12),
      ]),
      makeSection('Filtering logic', [
        makeLesson('Sort and pagination states', 10, true),
        makeLesson('Connecting filters to backend', 16),
      ]),
    ],
  }),
  withDuration({
    title: 'Checkout and Order Management',
    slug: 'checkout-and-order-management',
    description: 'Design clean checkout pages and connect them with real order APIs and payment method states.',
    thumbnail: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4',
    category: 'Checkout',
    level: 'intermediate',
    instructor: 'Phuc Le',
    price: 31,
    originalPrice: 45,
    studentsCount: 27,
    rating: 4.7,
    reviewsCount: 11,
    status: 'PUBLISHED',
    sections: [
      makeSection('Order basics', [
        makeLesson('Building a checkout summary', 10, true),
        makeLesson('Handling payment methods', 14),
      ]),
      makeSection('Order follow-up', [
        makeLesson('Order history screen', 9, true),
        makeLesson('Admin order status actions', 15),
      ]),
    ],
  }),
  withDuration({
    title: 'Admin Dashboard and Course CRUD',
    slug: 'admin-dashboard-and-course-crud',
    description: 'Set up admin pages for metrics, course CRUD, order management, and user lists.',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
    category: 'Admin',
    level: 'advanced',
    instructor: 'Khanh Hoang',
    price: 44,
    originalPrice: 64,
    studentsCount: 12,
    rating: 4.95,
    reviewsCount: 9,
    status: 'PUBLISHED',
    sections: [
      makeSection('Dashboard setup', [
        makeLesson('Metric cards and summary panels', 12, true),
        makeLesson('Role based route guards', 16),
      ]),
      makeSection('CRUD flow', [
        makeLesson('Create and update course forms', 14, true),
        makeLesson('Admin orders and users pages', 19),
      ]),
    ],
  }),
]

await mongoose.connect(mongoUri, { dbName })

for (const course of courses) {
  await upsertCourseBySlug(course)
}

console.log(`Seeded ${courses.length} demo courses`)

await mongoose.disconnect()
