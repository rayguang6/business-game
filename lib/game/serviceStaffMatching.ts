/**
 * Service-Staff Matching Logic
 * 
 * Simple service-driven matching: Services specify which staff roles can perform them.
 * If a service has no requiredStaffRoleIds, any staff can perform it.
 */

import type { Staff } from '@/lib/features/staff';
import type { MainCharacter } from '@/lib/features/mainCharacter';
import type { IndustryServiceDefinition } from '@/lib/game/types';

/**
 * Union type for staff-like entities that can perform services
 */
export type ServiceProvider = Staff | MainCharacter;

/**
 * Check if a staff member or main character can perform a service
 * 
 * @param provider - The staff member or main character to check
 * @param service - The service to check
 * @returns true if the provider can perform the service
 */
export function canStaffPerformService(
  provider: ServiceProvider,
  service: IndustryServiceDefinition
): boolean {
  // If service specifies required roles, check if provider role matches
  if (service.requiredStaffRoleIds && service.requiredStaffRoleIds.length > 0) {
    return service.requiredStaffRoleIds.includes(provider.roleId);
  }
  
  // No restrictions (anyone can do it)
  return true;
}

/**
 * Find available staff for a service
 * 
 * @param service - The service that needs staff
 * @param hiredStaff - All hired staff members
 * @param mainCharacter - Optional main character
 * @returns The first available staff member or main character who can perform the service, or null
 */
export function findAvailableStaffForService(
  service: IndustryServiceDefinition,
  hiredStaff: Staff[],
  mainCharacter?: MainCharacter | null
): ServiceProvider | null {
  // Collect all potential providers (staff + main character)
  const allProviders: ServiceProvider[] = [...hiredStaff];
  if (mainCharacter) {
    allProviders.push(mainCharacter);
  }
  
  // Filter to providers who can perform this service
  const capableProviders = allProviders.filter(provider => 
    canStaffPerformService(provider, service)
  );
  
  // Filter to available (not currently serving) providers
  const idleProviders = capableProviders.filter(provider => {
    const status = provider.status || 'idle';
    const assignedRoomId = provider.assignedRoomId;
    // Staff is available only if idle AND not assigned to a room
    return status === 'idle' && !assignedRoomId;
  });
  
  // Return first available, or null
  return idleProviders[0] || null;
}

/**
 * Find available main character for a service
 * 
 * @param service - The service that needs staff
 * @param mainCharacter - The main character
 * @returns The main character if available and can perform the service, or null
 */
export function findAvailableMainCharacterForService(
  service: IndustryServiceDefinition,
  mainCharacter: MainCharacter | null
): MainCharacter | null {
  if (!mainCharacter) {
    return null;
  }
  
  // Check if main character can perform this service
  if (!canStaffPerformService(mainCharacter, service)) {
    return null;
  }
  
  // Check if main character is available (not currently serving)
  const status = mainCharacter.status || 'idle';
  const assignedRoomId = mainCharacter.assignedRoomId;
  if (status !== 'idle' || assignedRoomId) {
    return null;
  }
  
  return mainCharacter;
}

/**
 * Get all staff and main character who can perform a service (regardless of availability)
 * 
 * @param service - The service to check
 * @param hiredStaff - All hired staff members
 * @param mainCharacter - Optional main character
 * @returns Array of staff members and main character who can perform the service
 */
export function getAllCapableProvidersForService(
  service: IndustryServiceDefinition,
  hiredStaff: Staff[],
  mainCharacter?: MainCharacter | null
): ServiceProvider[] {
  const allProviders: ServiceProvider[] = [...hiredStaff];
  if (mainCharacter) {
    allProviders.push(mainCharacter);
  }
  
  return allProviders.filter(provider => canStaffPerformService(provider, service));
}
/**
 * Get all staff who can perform a service (regardless of availability)
 * Legacy function - kept for backward compatibility
 * 
 * @param service - The service to check
 * @param hiredStaff - All hired staff members
 * @returns Array of staff members who can perform the service
 */
export function getCapableStaffForService(
  service: IndustryServiceDefinition,
  hiredStaff: Staff[]
): Staff[] {
  return hiredStaff.filter(staff => canStaffPerformService(staff, service));
}

