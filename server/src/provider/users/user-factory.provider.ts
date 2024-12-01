import { Injectable } from '@nestjs/common';
import { BaseUserProvider } from './base-user.provider';
import { AdminUserProvider } from './admin.provider';
import { DeveloperUserProvider } from './developer.provider';
import { EnterpriseUserProvider } from './enterprise.provider';

@Injectable()
export class UserFactoryProvider {
  private providers: Map<string, BaseUserProvider<any>>;

  constructor(
    private readonly adminProvider: AdminUserProvider,
    private readonly developerProvider: DeveloperUserProvider,
    private readonly enterpriseProvider: EnterpriseUserProvider,
  ) {
    this.providers = new Map<string, BaseUserProvider<any>>([
      ['admin', adminProvider],
      ['developer', developerProvider],
      ['enterprise', enterpriseProvider],
    ]);
  }

  getProvider(role: string): BaseUserProvider<any> {
    const provider = this.providers.get(role);
    if (!provider) {
      throw new Error(`No provider found for role: ${role}`);
    }
    return provider;
  }
}
