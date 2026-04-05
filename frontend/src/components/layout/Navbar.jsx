import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { getCoursesRequest } from '../../api/courses'
import Icon from '../common/Icon.jsx'
import { useAuthStore } from '../../store/authStore'
import { resolveMediaUrl } from '../../lib/mediaUrl'

const publicNavItems = [
  { to: '/', label: 'Home' },
]

function Navbar() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const isAdmin = user?.role === 'ADMIN'
  const initials = (user?.fullName || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
  const navItems = user
    ? [
        ...publicNavItems,
        ...(isAdmin
          ? [
              { to: '/admin/categories', label: 'Categories' },
              { to: '/admin/orders', label: 'Orders' },
              { to: '/admin', label: 'Admin' },
            ]
          : [
              { to: '/my-learning', label: 'My learning' },
              { to: '/orders', label: 'Orders' },
            ]),
      ]
    : publicNavItems

  const trimmedSearch = useMemo(() => search.trim(), [search])

  useEffect(() => {
    if (trimmedSearch.length < 1) {
      setSearchResults([])
      setSearchLoading(false)
      return
    }

    let mounted = true
    const timer = window.setTimeout(async () => {
      setSearchLoading(true)
      try {
        const data = await getCoursesRequest({ page: 0, size: 6, search: trimmedSearch, sort: 'newest' })
        if (!mounted) {
          return
        }
        setSearchResults(data?.courses ?? [])
      } catch {
        if (mounted) {
          setSearchResults([])
        }
      } finally {
        if (mounted) {
          setSearchLoading(false)
        }
      }
    }, 250)

    return () => {
      mounted = false
      window.clearTimeout(timer)
    }
  }, [trimmedSearch])

  function openSearchResult(course) {
    setSearchOpen(false)
    navigate(course.slug ? `/courses/${course.slug}` : '/courses')
  }

  function submitSearch(event) {
    event.preventDefault()
    if (!trimmedSearch) {
      return
    }
    setSearchOpen(false)
    navigate(`/courses?search=${encodeURIComponent(trimmedSearch)}`)
  }

  return (
    <header className="sticky top-0 z-40 rounded-2xl border border-line bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-5">
      <div className="flex min-w-0 flex-wrap items-center gap-3 lg:flex-nowrap lg:gap-5">
        <Link className="inline-flex min-w-0 shrink-0 items-center gap-3 no-underline" to="/">
          <img alt="EduLearn logo" className="h-11 w-11 rounded-xl object-cover" src="/edulearn-logo.svg" />
          <span className="type-title-lg text-ink-950 hidden whitespace-nowrap sm:inline">EduLearn</span>
        </Link>

        <nav className="hidden items-center gap-4 lg:flex">
          <NavLink className={({ isActive }) => `text-sm no-underline ${isActive ? 'text-ink-950 font-semibold' : 'text-ink-700'}`} to="/courses">
            Explore
          </NavLink>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) => `text-sm no-underline ${isActive ? 'text-ink-950 font-semibold' : 'text-ink-700'}`}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="order-3 relative w-full min-w-0 lg:order-none lg:ml-auto lg:w-auto lg:min-w-[18rem] lg:flex-1 lg:max-w-[36rem]">
          <form className="flex min-h-[50px] min-w-0 items-center gap-3 rounded-full border border-line bg-[#f7f7fb] px-4" onSubmit={submitSearch}>
            <Icon name="search" className="h-5 w-5 text-ink-500" />
            <input
              className="w-full min-w-0 border-none bg-transparent text-sm text-ink-950 outline-none"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search for anything"
            />
          </form>

          {searchOpen ? (
            <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_16px_40px_rgba(22,30,52,0.15)]">
              {trimmedSearch.length < 1 ? (
                <p className="px-4 py-3 text-sm text-ink-500">Type to search courses.</p>
              ) : null}

              {trimmedSearch.length >= 1 && searchLoading ? <p className="px-4 py-3 text-sm text-ink-500">Searching courses...</p> : null}

              {trimmedSearch.length >= 1 && !searchLoading && searchResults.length === 0 ? (
                <p className="px-4 py-3 text-sm text-ink-500">No matching courses found.</p>
              ) : null}

              {searchResults.length > 0 ? (
                <div className="max-h-[20rem] overflow-auto py-2">
                  {searchResults.map((course) => (
                    <button
                      key={course.id}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left transition hover:bg-[#f5f3ff]"
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => openSearchResult(course)}
                    >
                      <div className="h-12 w-20 shrink-0 overflow-hidden rounded-md bg-[#ece8ff]">
                        {course.thumbnail ? (
                          <img alt={course.title} className="h-full w-full object-cover" src={resolveMediaUrl(course.thumbnail)} />
                        ) : null}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-sm font-semibold text-ink-950">{course.title}</p>
                        <p className="truncate text-xs text-ink-600">{course.category || 'Course'} - {course.instructor || 'EduLearn Team'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {searchOpen ? (
            <button
              className="fixed inset-0 z-40 cursor-default bg-transparent"
              type="button"
              aria-label="Close search results"
              onClick={() => setSearchOpen(false)}
            />
          ) : null}
        </div>

        <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
          {!isAdmin ? (
            <Link aria-label="Checkout" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink-950 no-underline" to="/checkout">
              <Icon name="checkout" className="h-5 w-5" />
            </Link>
          ) : null}

          {user ? (
            <details className="avatar-menu">
              <summary className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-2 py-1.5">
                <span className="hidden max-w-[7rem] truncate whitespace-nowrap text-sm font-semibold text-ink-950 sm:inline">{user.fullName}</span>
                {user.avatarUrl ? (
                  <img alt={user.fullName} className="h-9 w-9 rounded-full object-cover" src={resolveMediaUrl(user.avatarUrl)} />
                ) : (
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink-950 text-xs font-bold text-white">{initials}</span>
                )}
              </summary>
              <div className="avatar-menu-panel">
                <div className="avatar-menu-header">
                  <p className="type-title-sm text-ink-950 truncate">{user.fullName}</p>
                  <p className="type-body-sm text-ink-700 truncate">{user.email}</p>
                </div>
                <Link className="avatar-menu-link" to="/profile">
                  Profile settings
                </Link>
                <button className="avatar-menu-link avatar-menu-button" type="button" onClick={logout}>
                  Log out
                </button>
              </div>
            </details>
          ) : (
            <>
              <Link className="hidden rounded-lg border border-ink-950 px-4 py-2 text-sm font-semibold text-ink-950 no-underline sm:inline-flex" to="/login">
                Log in
              </Link>
              <Link className="inline-flex rounded-lg border border-[#1b2234] bg-[#1b2234] px-4 py-2 text-sm font-semibold text-white no-underline" to="/register">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
