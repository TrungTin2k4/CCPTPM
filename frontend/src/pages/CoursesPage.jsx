import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getCourseCategoriesRequest, getCoursesRequest } from '../api/courses'
import CourseCard from '../components/common/CourseCard.jsx'
import FeedbackMessage from '../components/common/FeedbackMessage.jsx'
import FilterBar from '../components/common/FilterBar.jsx'
import { defaultCourseFilters } from '../data/content'
import { buildCourseCardModel } from '../lib/courseUi'

function CoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState(defaultCourseFilters)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sort, setSort] = useState('newest')
  const [search, setSearch] = useState(() => searchParams.get('search') ?? '')
  const [catalog, setCatalog] = useState([])
  const [pageInfo, setPageInfo] = useState({ totalItems: 0, totalPages: 1, currentPage: 0 })
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const nextSearch = searchParams.get('search') ?? ''
    if (nextSearch !== search) {
      setSearch(nextSearch)
    }
  }, [search, searchParams])

  useEffect(() => {
    const currentSearch = searchParams.get('search') ?? ''
    if (currentSearch === search) {
      return
    }

    const nextParams = new URLSearchParams(searchParams)
    if (search) {
      nextParams.set('search', search)
    } else {
      nextParams.delete('search')
    }

    setSearchParams(nextParams, { replace: true })
  }, [search, searchParams, setSearchParams])

  useEffect(() => {
    async function loadStaticBits() {
      try {
        const nextCategories = await getCourseCategoriesRequest()
        setCategories(['All', ...(nextCategories ?? [])])
      } catch {
        setCategories(defaultCourseFilters)
      }
    }

    loadStaticBits()
  }, [])

  useEffect(() => {
    async function loadCourses() {
      setLoading(true)
      setErrorMessage('')

      try {
        const data = await getCoursesRequest({
          page: 0,
          size: 12,
          category: selectedCategory === 'All' ? '' : selectedCategory,
          search,
          sort,
        })

        setCatalog(data?.courses ?? [])
        setPageInfo({
          totalItems: data?.totalItems ?? 0,
          totalPages: data?.totalPages ?? 1,
          currentPage: data?.currentPage ?? 0,
        })
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [search, selectedCategory, sort])

  const catalogCards = useMemo(
    () =>
      catalog.map((course, index) =>
        buildCourseCardModel(course, {
          tone: ['brand', 'accent', 'ink'][index % 3],
          tag: course.category || 'Course',
        }),
      ),
    [catalog],
  )

  return (
    <section className="section-shell space-y-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl space-y-3">
          <p className="type-label text-brand-600">Courses</p>
          <h1 className="type-display-2xl text-ink-950">Find useful courses for your next step</h1>
          <p className="type-body-lg text-ink-700">Search by title, browse by tag, and filter quickly to discover practical, affordable lessons.</p>
        </div>
        <div className="courses-summary-strip">
          <div className="mini-stat"><span className="type-title-lg text-ink-950">{pageInfo.totalItems}</span><span className="type-caption text-ink-500">Courses</span></div>
          <div className="mini-stat"><span className="type-title-lg text-ink-950">{categories.length - 1}</span><span className="type-caption text-ink-500">Tags</span></div>
          <div className="mini-stat"><span className="type-title-lg text-ink-950">25%</span><span className="type-caption text-ink-500">Discount today</span></div>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        sort={sort}
        onSortChange={setSort}
      />

      <FeedbackMessage type="error">{errorMessage}</FeedbackMessage>

      {loading ? <div className="loading-panel">Loading courses...</div> : null}

      {!loading && !errorMessage ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {catalogCards.length > 0 ? (
            catalogCards.map((course) => <CourseCard key={course.id} course={course} />)
          ) : (
            <div className="empty-panel">No courses match the current filters.</div>
          )}
        </div>
      ) : null}
    </section>
  )
}

export default CoursesPage
