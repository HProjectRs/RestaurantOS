import * as Sentry from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'
import express from 'express'

export function initSentry(app: express.Application): void {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) {
    console.warn('SENTRY_DSN not set — Sentry error monitoring disabled')
    return
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      nodeProfilingIntegration(),
    ],
  })
}

export function setupSentryErrorHandler(app: express.Application): void {
  Sentry.setupExpressErrorHandler(app)
}

export default Sentry
