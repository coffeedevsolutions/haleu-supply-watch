import Link from "next/link";

export const metadata = {
  title: 'HALEU Supply Watch',
  description: 'Track HALEU allocations and deliveries',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
        <header style={{ 
          backgroundColor: '#1f2937', 
          color: 'white', 
          padding: '1rem 2rem',
          borderBottom: '1px solid #374151'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
              <Link href="/" style={{ color: 'white', textDecoration: 'none' }}>
                HALEU Supply Watch
              </Link>
            </h1>
            <nav>
              <ul style={{ 
                display: 'flex', 
                gap: '2rem', 
                listStyle: 'none', 
                margin: 0, 
                padding: 0 
              }}>
                <li>
                  <Link 
                    href="/" 
                    style={{ 
                      color: 'white', 
                      textDecoration: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.25rem',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/changes" 
                    style={{ 
                      color: 'white', 
                      textDecoration: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.25rem',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    What Changed
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/design-fuel" 
                    style={{ 
                      color: 'white', 
                      textDecoration: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.25rem',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    Design↔Fuel
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
