import type { RepositoryContainer } from '@/infrastructure/repositories/container'
import { repositories as defaultRepositories } from '@/infrastructure/repositories/container'
import type { CustomerEntity } from '@/application/repositories/interfaces'

export class CustomerService {
  constructor(private repos: RepositoryContainer = defaultRepositories) {}

  /**
   * Retrieves a customer by ID within a tenant scope.
   */
  async getCustomer(tenantId: string, id: string): Promise<CustomerEntity | null> {
    const customer = await this.repos.customers.findById(id)
    if (!customer || customer.tenantId !== tenantId) {
      return null
    }
    return customer
  }

  /**
   * Lists all customers for a tenant.
   */
  async listCustomers(tenantId: string): Promise<CustomerEntity[]> {
    return this.repos.customers.list(tenantId)
  }

  /**
   * Searches customers by phone or name within a tenant scope.
   */
  async searchCustomers(tenantId: string, query: string): Promise<CustomerEntity[]> {
    const all = await this.repos.customers.list(tenantId)
    const clean = query.trim().toLowerCase()
    if (!clean) return all

    return all.filter(
      c => c.name.toLowerCase().includes(clean) || c.phone.includes(clean) || (c.email && c.email.toLowerCase().includes(clean))
    )
  }

  /**
   * Finds customer by phone or creates a new customer record.
   */
  async findOrCreate(
    tenantId: string,
    data: { name: string; phone: string; email?: string; notes?: string }
  ): Promise<CustomerEntity> {
    if (!tenantId || tenantId.trim() === '') {
      throw new Error('Tenant ID is required to create or resolve customer')
    }
    const existing = await this.repos.customers.findByPhone(tenantId, data.phone)
    if (existing) {
      return existing
    }

    return this.repos.customers.create({
      tenantId,
      name: data.name,
      phone: data.phone,
      email: data.email,
      notes: data.notes || '',
      segment: 'new',
    })
  }

  /**
   * Updates customer segment or notes.
   */
  async updateCustomer(
    tenantId: string,
    id: string,
    patch: Partial<Pick<CustomerEntity, 'name' | 'phone' | 'email' | 'notes' | 'segment'>>
  ): Promise<CustomerEntity | null> {
    const cust = await this.getCustomer(tenantId, id)
    if (!cust) return null

    return this.repos.customers.update(id, patch)
  }
}

export const customerService = new CustomerService()

