/**
 * Service-Staff Matching Logic
 * 
 * Simple service-driven matching: Services specify which staff roles can perform them.
 * If a service has no requiredStaffRoleIds, any staff can perform it.
 */

import type { Staff } from '@/lib/features/staff';
import type { IndustryServiceDefinition } from '@/lib/game/types';

/**
 * Check if a staff member can perform a service
 * 
 * @param staff - The staff member to check
 * @param service - The service to check
 * @returns true if the staff member can perform the service
 */
export function canStaffPerformService(
  staff: Staff,
  service: IndustryServiceDefinition
): boolean {
  // If service specifies required roles, check if staff role matches
  if (service.requiredStaffRoleIds && service.requiredStaffRoleIds.length > 0) {
    return service.requiredStaffRoleIds.includes(staff.roleId);
  }
  
  // No restrictions (anyone can do it)
  return true;
}

/**
 * Find available staff for a service
 * 
 * @param service - The service that needs staff
 * @param hiredStaff - All hired staff members
 * @returns The first available staff member who can perform the service, or null
 */
export function findAvailableStaffForService(
  service: IndustryServiceDefinition,
  hiredStaff: Staff[]
): Staff | null {
  // Filter to staff who can perform this service
  const capableStaff = hiredStaff.filter(staff => 
    canStaffPerformService(staff, service)
  );
  
  // Filter to available (not currently serving) staff
  const idleStaff = capableStaff.filter(staff => {
    const status = staff.status || 'idle';
    const assignedRoomId = staff.assignedRoomId;
    return status === 'idle' || !assignedRoomId;
  });
  
  // Return first available, or null
  return idleStaff[0] || null;
}

/**
 * Get all staff who can perform a service (regardless of availability)
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

