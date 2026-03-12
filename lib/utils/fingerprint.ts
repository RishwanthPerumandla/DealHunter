'use client';

import { openDB } from 'idb';
import { FingerprintComponents, FingerprintId } from '@/types';
import { supabase } from '@/lib/db/supabase';

const STORAGE_KEY = 'desideals_fingerprint';
const DB_NAME = 'DesiDealsDB';
const DB_VERSION = 1;

// Initialize IndexedDB
async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('fingerprints')) {
        db.createObjectStore('fingerprints', { keyPath: 'id' });
      }
    },
  });
}

// Generate SHA256 hash
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Get WebGL renderer info
function getWebGLRenderer(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'unknown';
    
    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      return (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown';
    }
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

// Generate canvas fingerprint
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    canvas.width = 200;
    canvas.height = 50;
    
    // Draw text with various styles
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#FF9933';
    ctx.fillText('DesiDeals v1.0', 2, 2);
    
    ctx.font = 'bold 16px Times New Roman';
    ctx.fillStyle = '#138808';
    ctx.fillText('🇮🇳', 100, 15);
    
    // Add some shapes
    ctx.strokeStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(150, 25, 10, 0, Math.PI * 2);
    ctx.stroke();
    
    return canvas.toDataURL();
  } catch {
    return '';
  }
}

// Get fingerprint components
async function getFingerprintComponents(): Promise<FingerprintComponents> {
  return {
    canvas: getCanvasFingerprint(),
    webgl: getWebGLRenderer(),
    screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    touch: 'ontouchstart' in window,
  };
}

// Register fingerprint in database
async function registerFingerprint(id: FingerprintId, components: FingerprintComponents): Promise<boolean> {
  try {
    // Use upsert to handle duplicates gracefully
    const { error } = await supabase
      .from('user_fingerprints')
      .upsert({
        id: id,
        fingerprint_hash: id,
        canvas_hash: await sha256(components.canvas),
        webgl_renderer: components.webgl,
        screen_resolution: components.screen,
        timezone: components.timezone,
        language: components.language,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
      }, {
        onConflict: 'id',
        ignoreDuplicates: false // Update on conflict
      });

    if (error) {
      console.error('Failed to register fingerprint:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Error registering fingerprint:', err);
    return false;
  }
}

// Get or create fingerprint
export async function getFingerprint(): Promise<FingerprintId> {
  // Check localStorage first
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    // Try to register in DB (might fail silently, that's ok)
    try {
      const components = await getFingerprintComponents();
      await registerFingerprint(existing, components);
    } catch {
      // Ignore errors
    }
    return existing;
  }
  
  // Check IndexedDB as backup
  try {
    const db = await getDB();
    const stored = await db.get('fingerprints', 'main');
    if (stored?.hash) {
      localStorage.setItem(STORAGE_KEY, stored.hash);
      return stored.hash;
    }
  } catch {
    // IndexedDB failed, continue
  }
  
  // Check cookie as last resort
  const cookieMatch = document.cookie.match(/did=([^;]+)/);
  if (cookieMatch) {
    localStorage.setItem(STORAGE_KEY, cookieMatch[1]);
    return cookieMatch[1];
  }
  
  // Generate new fingerprint
  const components = await getFingerprintComponents();
  const hash = await sha256(JSON.stringify(components));
  
  // Try to register in database (but don't wait or fail if it doesn't work)
  try {
    await registerFingerprint(hash, components);
  } catch {
    // Continue even if registration fails
  }
  
  // Store in all available storage mechanisms
  localStorage.setItem(STORAGE_KEY, hash);
  
  try {
    const db = await getDB();
    await db.put('fingerprints', { id: 'main', hash, components });
  } catch {
    // IndexedDB failed
  }
  
  // Set cookie (expires in 1 year)
  document.cookie = `did=${hash};path=/;max-age=31536000;SameSite=Strict`;
  
  return hash;
}

// Get fingerprint components for server registration
export async function getFingerprintData() {
  const components = await getFingerprintComponents();
  const hash = await sha256(JSON.stringify(components));
  
  // Try to register
  await registerFingerprint(hash, components);
  
  return {
    id: hash,
    fingerprint_hash: hash,
    canvas_hash: await sha256(components.canvas),
    webgl_renderer: components.webgl,
    screen_resolution: components.screen,
    timezone: components.timezone,
    language: components.language,
  };
}

// Reset fingerprint (for privacy)
export async function resetFingerprint(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY);
  
  try {
    const db = await getDB();
    await db.delete('fingerprints', 'main');
  } catch {
    // Ignore errors
  }
  
  document.cookie = 'did=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

// Check if fingerprint exists
export function hasFingerprint(): boolean {
  return !!localStorage.getItem(STORAGE_KEY);
}

// Generate session ID
export function getSessionId(): string {
  const key = 'desideals_session';
  let sessionId = sessionStorage.getItem(key);
  
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem(key, sessionId);
  }
  
  return sessionId;
}
