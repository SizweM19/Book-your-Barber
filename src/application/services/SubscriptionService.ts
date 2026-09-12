import type { RepositoryContainer } from '@/infrastructure/repositories/container'
import { repositories as defaultRepositories } from '@/infrastructure/repositories/container'

export interface PlatformPlan {
  id: string
  name: string
  slug: string
  monthlyPrice: number
  annualPrice: number
  features: string[]
}

export interface TenantSubscription {
  id: string
  tenantId: string
  planId: string
  status: 'active' | 'past_due' | 'cancelled' | 'trialing'
  currentPeriodStart: string
  currentPeriodEnd: string
}

const DEFAULT_PLANS: PlatformPlan[] = [
  {
    id: 'plan-starter',
    name: 'Starter Solo',
    slug: 'starter',
    monthlyPrice: 299,
    annualPrice: 2990,
    features: ['1-barber', 'online-booking', 'whatsapp-reminders', 'basic-analytics'],
  },
  {
    id: 'plan-growth',
    name: 'Salon Growth',
    slug: 'growth',
    monthlyPrice: 699,
    annualPrice: 6990,
    features: ['up-to-5-barbers', 'online-booking', 'whatsapp-reminders', 'financial-reports', 'client-crm'],
  },
  {
    id: 'plan-pro',
    name: 'Barbershop Enterprise',
    slug: 'enterprise',
    monthlyPrice: 1299,
    annualPrice: 12990,
    features: ['unlimited-barbers', 'online-booking', 'custom-branding', 'advanced-reports', 'dedicated-support'],
  },
]

export class SubscriptionService {
  private subscriptions: Map<string, TenantSubscription> = new Map()

  constructor(private repos: RepositoryContainer = defaultRepositories) {}

  /**
   * Retrieves all available subscription plans.
   */
  async listPlans(): Promise<PlatformPlan[]> {
    return DEFAULT_PLANS
  }

  /**
   * Retrieves active subscription for a salon tenant.
   */
  async getTenantSubscription(tenantId: string): Promise<TenantSubscription> {
    const existing = this.subscriptions.get(tenantId)
    if (existing) return existing

    const fallback: TenantSubscription = {
      id: `sub-${tenantId}`,
      tenantId,
      planId: 'plan-growth',
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
    this.subscriptions.set(tenantId, fallback)
    return fallback
  }

  /**
   * Validates whether a tenant is entitled to a specific platform feature.
   */
  async hasFeature(tenantId: string, featureKey: string): Promise<boolean> {
    const sub = await this.getTenantSubscription(tenantId)
    if (sub.status !== 'active' && sub.status !== 'trialing') {
      return false
    }

    const plan = DEFAULT_PLANS.find(p => p.id === sub.planId)
    return !!plan?.features.includes(featureKey)
  }
}

export const subscriptionService = new SubscriptionService()

