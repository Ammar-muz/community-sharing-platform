import './globals.css'

export const metadata = {
  title: 'CommunityShare - Sri Lanka',
  description: 'Share resources in your community',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{
        margin: '0',
        padding: '0',
        background: '#0a1628',
        width: '100%',
        overflowX: 'hidden'
      }}>
        {children}
      </body>
    </html>
  )
}