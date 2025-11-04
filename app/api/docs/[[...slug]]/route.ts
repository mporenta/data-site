export async function GET(request: Request, { params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params
  const path = slug && slug.length > 0 ? `/${slug.join('/')}` : ''

  const apiUrl = process.env.API_URL || 'http://127.0.0.1:8000'

  let fetchPath: string
  if (slug && slug.length === 1 && slug[0] === 'openapi.json') {
    fetchPath = '/openapi.json'
  } else {
    fetchPath = `/docs${path}`
  }

  try {
    const response = await fetch(`${apiUrl}${fetchPath}`, {
      method: 'GET',
      headers: {
        'Accept': request.headers.get('Accept') || '*/*',
        'User-Agent': request.headers.get('User-Agent') || '',
      },
    })

    const contentType = response.headers.get('Content-Type') || 'text/html'

    const body = await response.text()

    let modifiedBody = body
    if (contentType.includes('text/html')) {
      // Replace the openapi url to point to /docs/openapi.json so it works when served at /docs
      modifiedBody = body.replace(/\/openapi\.json/g, '/docs/openapi.json')
    } else if (contentType.includes('application/json') && slug && slug[0] === 'openapi.json') {
      // Modify the OpenAPI schema to prefix paths with /api
      try {
        const schema = JSON.parse(body)
        const newPaths: any = {}
        for (const [path, methods] of Object.entries(schema.paths)) {
          newPaths['/api' + path] = methods
        }
        schema.paths = newPaths
        // Update servers if present
        if (schema.servers) {
          schema.servers = [{ url: 'https://data.porenta.us' }]
        }
        modifiedBody = JSON.stringify(schema)
      } catch (e) {
        console.error('Error modifying OpenAPI schema:', e)
        // Fallback to original
      }
    }

    return new Response(modifiedBody, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
      },
    })
  } catch (error) {
    console.error('Error proxying to FastAPI docs:', error)
    return new Response('Error fetching OpenAPI docs', { status: 500 })
  }
}