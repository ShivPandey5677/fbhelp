import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/integration', label: 'Facebook Integration' },
]

export default function Navbar() {
  const pathname = usePathname() || ''

  return (
    <nav className="w-full bg-blue-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-12 items-center space-x-6">
          <span className="font-semibold text-lg flex-1">FB Helpdesk</span>
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors ${
                pathname.startsWith(href) ? 'bg-blue-700' : ''
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
