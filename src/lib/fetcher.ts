import { checkSvgContent } from './utils'

const DEFAULT_TIMEOUT = 4800
const DEFAULT_RETRY_COUNT = 2

interface RequestParams extends RequestInit {
  timeout?: number;
  retryCount?: number;
}

async function fetchWithTimeout(url: string, params?: RequestParams) {
  const timeout = params?.timeout || DEFAULT_TIMEOUT
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {...params, signal: controller.signal})
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

async function doFetch(url: string, params?: RequestParams): Promise<string> {
  let retryCount = params?.retryCount === undefined
    ? DEFAULT_RETRY_COUNT
    : params?.retryCount

  try {
    const response = await fetchWithTimeout(url, params)
    if (response.ok) {
      return response.text()
    }
    throw new Error(`Unable to load SVG file: ${url}`)
  } catch (error) {
    if (retryCount > 0) {
      retryCount--
      return doFetch(url, params)
    }
    throw error
  }
}

export async function fetchSvg(url: string, params?: RequestParams) {
  const response = await doFetch(url, params)
  checkSvgContent(response)
  return response
}
