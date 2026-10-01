import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const locks=sqliteTable('lovely_locks',{id:text().primaryKey(),title:text().notNull(),url:text().notNull(),ownerHash:text('owner_hash').notNull(),passwordHash:text('password_hash'),salt:text(),email:text().notNull(),resetHash:text('reset_hash'),resetExpires:integer('reset_expires'),createdAt:integer('created_at').notNull()});
export const rates=sqliteTable('lovely_rates',{id:text().primaryKey(),count:integer().notNull(),expires:integer().notNull()});
