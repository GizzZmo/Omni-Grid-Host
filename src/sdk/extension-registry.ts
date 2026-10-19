/**
 * Extension Loader & Registry
 */

import type {
  OmniExtensionManifest,
  ExtensionRegistration,
  Permission,
} from './types';
import { omniBus } from './event-bus';

export class ExtensionRegistry {
  private extensions = new Map<string, ExtensionRegistration>();
  private grantedPermissions = new Map<string, Set<Permission>>();

  register(manifest: OmniExtensionManifest): ExtensionRegistration {
    if (this.extensions.has(manifest.id)) {
      throw new Error(`Extension ${manifest.id} already registered`);
    }

    const reg: ExtensionRegistration = {
      manifest,
      status: 'registered',
    };

    this.extensions.set(manifest.id, reg);
    omniBus.emit({
      type: 'system/extension-registered',
      data: { id: manifest.id, name: manifest.name },
      source: 'host',
    });

    return reg;
  }

  unregister(id: string): void {
    const reg = this.extensions.get(id);
    if (!reg) return;
    this.extensions.delete(id);
    this.grantedPermissions.delete(id);
    omniBus.emit({
      type: 'system/extension-unregistered',
      data: { id },
      source: 'host',
    });
  }

  get(id: string): ExtensionRegistration | undefined {
    return this.extensions.get(id);
  }

  list(category?: OmniExtensionManifest['category']): ExtensionRegistration[] {
    const all = Array.from(this.extensions.values());
    return category ? all.filter(e => e.manifest.category === category) : all;
  }

  setStatus(id: string, status: ExtensionRegistration['status'], error?: string): void {
    const reg = this.extensions.get(id);
    if (!reg) return;
    reg.status = status;
    reg.error = error;
  }

  grantPermission(extensionId: string, permission: Permission, persistent = false): void {
    if (!this.grantedPermissions.has(extensionId)) {
      this.grantedPermissions.set(extensionId, new Set());
    }
    this.grantedPermissions.get(extensionId)!.add(permission);
    omniBus.emit({
      type: 'system/permission-granted',
      data: { extensionId, permission, persistent },
      source: 'host',
    });
  }

  hasPermission(extensionId: string, permission: Permission): boolean {
    return this.grantedPermissions.get(extensionId)?.has(permission) ?? false;
  }

  checkPermissions(manifest: OmniExtensionManifest): Permission[] {
    const required = manifest.runtime?.permissions ?? [];
    return required.filter(p => !this.hasPermission(manifest.id, p));
  }
}

export const extensionRegistry = new ExtensionRegistry();
