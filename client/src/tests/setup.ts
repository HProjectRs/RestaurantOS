import '@testing-library/jest-dom/vitest'
import { setupServer } from 'msw/node'
import { handlers } from './handlers'
import { beforeAll, afterAll, afterEach } from 'vitest'
import '../i18n'

export const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
