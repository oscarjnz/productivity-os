"use client";

import Dexie, { type EntityTable } from "dexie";

/**
 * Local-first store. Mirrors the Supabase schema but with snake_case kept,
 * so reconciliation is a straight column copy without translation.
 *
 * All entities carry `updated_at` (ISO string) for last-write-wins merging.
 */

export interface DbWidgetInstance {
  id: string;
  dashboard_id: string;
  type: string;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
  config: Record<string, unknown>;
  z_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbTask {
  id: string;
  user_id: string;
  content: string;
  completed: boolean;
  priority: number;
  due_at: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface DbNote {
  id: string;
  user_id: string;
  content: string;
  color_index: number;
  pos_x: number;
  pos_y: number;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbBookmark {
  id: string;
  user_id: string;
  label: string;
  url: string;
  icon: string | null;
  group_name: string | null;
  position: number;
  created_at: string;
}

export type OutboxOp = "insert" | "update" | "delete";
export type OutboxEntity = "widget_instances" | "tasks" | "notes" | "bookmarks";

export interface DbOutboxItem {
  id: string; // op uuid
  entity: OutboxEntity;
  op: OutboxOp;
  rowId: string;
  payload: Record<string, unknown> | null; // null for delete
  createdAt: number; // epoch ms — drains FIFO
  attempts: number;
  lastError: string | null;
}

export interface DbMeta {
  key: string;
  value: unknown;
}

export type ChatRole = "user" | "assistant" | "system";

export interface DbChatMessage {
  id: string;
  instance_id: string; // widget instance — keeps chats scoped per widget
  role: ChatRole;
  content: string;
  created_at: string;
}

class ProductivityDexie extends Dexie {
  widget_instances!: EntityTable<DbWidgetInstance, "id">;
  tasks!: EntityTable<DbTask, "id">;
  notes!: EntityTable<DbNote, "id">;
  bookmarks!: EntityTable<DbBookmark, "id">;
  outbox!: EntityTable<DbOutboxItem, "id">;
  meta!: EntityTable<DbMeta, "key">;
  chat_messages!: EntityTable<DbChatMessage, "id">;

  constructor() {
    super("productivity-os");
    this.version(1).stores({
      widget_instances: "id, dashboard_id, updated_at",
      tasks: "id, user_id, completed, updated_at",
      notes: "id, user_id, updated_at",
      bookmarks: "id, user_id, position",
      outbox: "id, entity, createdAt",
      meta: "key",
    });
    // v2: AI chat messages, stored locally only — never synced to cloud.
    this.version(2).stores({
      chat_messages: "id, instance_id, created_at",
    });
  }
}

/**
 * Singleton accessor. SSR-safe: returns null if `window` is undefined.
 */
let _db: ProductivityDexie | null = null;
export function getDb(): ProductivityDexie | null {
  if (typeof window === "undefined") return null;
  if (!_db) _db = new ProductivityDexie();
  return _db;
}

export type { ProductivityDexie };
