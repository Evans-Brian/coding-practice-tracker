import { integer,sqliteTable,text } from 'drizzle-orm/sqlite-core';
export const progress=sqliteTable('progress',{
 id:text('id').primaryKey(),notes:text('notes').notNull().default(''),completions:integer('completions').notNull().default(0),tries:integer('tries'),repeat:integer('repeat').notNull().default(0)
});
