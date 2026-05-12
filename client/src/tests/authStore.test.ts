import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../store/authStore'

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      business: null,
      isAuthenticated: false,
      isLoading: false,
    })
    localStorage.clear()
  })

  it('starts with unauthenticated state', () => {
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.business).toBeNull()
  })

  it('logs in with valid credentials', async () => {
    const { login } = useAuthStore.getState()
    await login('admin@cafe.com', 'admin123')

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user).not.toBeNull()
    expect(state.user?.email).toBe('admin@cafe.com')
    expect(state.business).not.toBeNull()
    expect(state.business?.id).toBe('biz-1')
    expect(localStorage.getItem('accessToken')).toBe('mock-access-token')
    expect(localStorage.getItem('refreshToken')).toBe('mock-refresh-token')
  })

  it('rejects login with invalid credentials', async () => {
    const { login } = useAuthStore.getState()
    await expect(login('wrong@email.com', 'wrongpass')).rejects.toThrow()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
  })

  it('rejects login with missing fields', async () => {
    const { login } = useAuthStore.getState()
    await expect(login('', '')).rejects.toThrow()
  })

  it('logs out and clears state', async () => {
    localStorage.setItem('accessToken', 'mock-access-token')
    localStorage.setItem('refreshToken', 'mock-refresh-token')
    useAuthStore.setState({
      user: { id: 'user-1', email: 'admin@cafe.com', name: 'Admin', role: 'ADMIN' },
      isAuthenticated: true,
    })

    const { logout } = useAuthStore.getState()
    await logout()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.business).toBeNull()
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
  })

  it('updates user fields', () => {
    useAuthStore.setState({
      user: { id: 'user-1', email: 'admin@cafe.com', name: 'Admin', role: 'ADMIN' },
      isAuthenticated: true,
    })

    useAuthStore.getState().updateUser({ name: 'Updated Admin' })
    const state = useAuthStore.getState()
    expect(state.user?.name).toBe('Updated Admin')
    expect(state.user?.email).toBe('admin@cafe.com')
  })

  it('does not throw when updating user if user is null', () => {
    expect(() => useAuthStore.getState().updateUser({ name: 'No one' })).not.toThrow()
  })

  it('logs in with pin', async () => {
    const { loginWithPin } = useAuthStore.getState()
    await loginWithPin('1234')

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user?.name).toBe('Waiter')
  })

  it('fails login with invalid pin', async () => {
    const { loginWithPin } = useAuthStore.getState()
    await expect(loginWithPin('0000')).rejects.toThrow()
  })

  it('checkAuth does not authenticate without token', async () => {
    const { checkAuth } = useAuthStore.getState()
    await checkAuth()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
  })

  it('checkAuth authenticates with valid token', async () => {
    localStorage.setItem('accessToken', 'mock-access-token')
    const { checkAuth } = useAuthStore.getState()
    await checkAuth()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user?.email).toBe('admin@cafe.com')
  })
})
