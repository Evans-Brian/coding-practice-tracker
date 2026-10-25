import { index,integer,sqliteTable,text } from 'drizzle-orm/sqlite-core';
export const progress=sqliteTable('progress',{
 id:text('id').primaryKey(),notes:text('notes').notNull().default(''),completions:integer('completions').notNull().default(0),tries:integer('tries'),repeat:integer('repeat').notNull().default(0),submitted:integer('submitted').notNull().default(0),retained:integer('retained').notNull().default(0),lastSubmission:text('last_submission')
});
export const completionEvents=sqliteTable('completion_events',{
 submissionId:text('submission_id').primaryKey(),
 questionId:text('question_id').notNull(),
 difficulty:text('difficulty').notNull(),
 pointUnits:integer('point_units').notNull(),
 completedAt:text('completed_at').notNull(),
 completedDay:text('completed_day').notNull(),
},table=>[index('completion_events_day_question_idx').on(table.completedDay,table.questionId)]);
