/**
 * Audit Logger - Phase 4.1
 * Tamper-proof logging of compliance actions with hash chain
 */

import crypto from 'crypto';
import prisma from '../infra/prisma';

export interface AuditLogEntry {
    userId: string;
    aiSystemId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    description: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    firmId?: string;
    firmClientId?: string;
}

/**
 * Generate SHA-256 hash of log entry content
 */
function generateHash(entry: AuditLogEntry, previousHash: string | null): string {
    const content = JSON.stringify({
        userId: entry.userId,
        aiSystemId: entry.aiSystemId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        description: entry.description,
        metadata: entry.metadata,
        firmId: entry.firmId,
        firmClientId: entry.firmClientId,
        previousHash,
        timestamp: new Date().toISOString(),
    });

    return crypto.createHash('sha256').update(content).digest('hex');
}

// GDPR Art. 5(1)(c) — Truncate IP to remove last octet
function anonymiseIp(ip?: string): string | undefined {
    if (!ip) return undefined;
    // IPv4: 192.168.1.100 → 192.168.1.x
    if (ip.includes('.')) {
        return ip.split('.').slice(0, 3).join('.') + '.x';
    }
    // IPv6: 2001:db8::1 → 2001:db8::x
    return ip.split(':').slice(0, 4).join(':') + ':x';
}

/**
 * Create an audit log entry with hash chain
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<string> {
    try {
        // Get the most recent log entry for this user to chain hashes
        const previousEntry = await prisma.auditLog.findFirst({
            where: { user_id: entry.userId },
            orderBy: { created_at: 'desc' },
            select: { hash: true }
        });

        const previousHash = previousEntry?.hash || null;
        const hash = generateHash(entry, previousHash);

        const log = await prisma.auditLog.create({
            data: {
                user_id: entry.userId,
                ai_system_id: entry.aiSystemId,
                action: entry.action,
                entity_type: entry.entityType,
                entity_id: entry.entityId,
                description: entry.description,
                metadata: entry.metadata ? JSON.parse(JSON.stringify(entry.metadata)) : undefined,
                previous_hash: previousHash,
                hash,
                ip_address: anonymiseIp(entry.ipAddress),
                user_agent: entry.userAgent,
                firm_id: entry.firmId,
                firm_client_id: entry.firmClientId,
            }
        });

        console.log(`[AUDIT] [AUDIT] ${entry.action} on ${entry.entityType} by ${entry.userId}`);

        return log.id;
    } catch (error) {
        console.error('Failed to log audit event:', error);
        throw error;
    }
}

/**
 * Verify hash chain integrity for a user's audit logs
 */
export async function verifyAuditChain(userId: string): Promise<{
    valid: boolean;
    totalEntries: number;
    brokenAt?: string;
}> {
    const logs = await prisma.auditLog.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'asc' },
        select: { id: true, hash: true, previous_hash: true }
    });

    if (logs.length === 0) {
        return { valid: true, totalEntries: 0 };
    }

    // First entry should have no previous hash
    if (logs[0].previous_hash !== null) {
        return { valid: false, totalEntries: logs.length, brokenAt: logs[0].id };
    }

    // Check chain integrity
    for (let i = 1; i < logs.length; i++) {
        if (logs[i].previous_hash !== logs[i - 1].hash) {
            return {
                valid: false,
                totalEntries: logs.length,
                brokenAt: logs[i].id
            };
        }
    }

    return { valid: true, totalEntries: logs.length };
}

// Predefined action types for consistency
export const AUDIT_ACTIONS = {
    // Scans
    SCAN_STARTED: 'scan_started',
    SCAN_COMPLETED: 'scan_completed',

    // Risk Classification
    RISK_CLASSIFIED: 'risk_classified',
    RISK_CHANGED: 'risk_changed',

    // Documents
    DOCUMENT_GENERATED: 'document_generated',
    DOCUMENT_EXPORTED: 'document_exported',
    DOCUMENT_EDITED: 'document_edited',

    // Evidence
    EVIDENCE_UPLOADED: 'evidence_uploaded',
    EVIDENCE_VERIFIED: 'evidence_verified',

    // Sharing
    SHARE_ENABLED: 'share_enabled',
    SHARE_DISABLED: 'share_disabled',

    // System
    SYSTEM_CREATED: 'system_created',
    SYSTEM_ARCHIVED: 'system_archived',
} as const;

export const ENTITY_TYPES = {
    AI_SYSTEM: 'ai_system',
    REPO_SCAN: 'repo_scan',
    DOCUMENT: 'document',
    REPORT: 'report',
    EVIDENCE: 'evidence',
} as const;
