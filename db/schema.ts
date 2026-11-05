import { index,integer,primaryKey,sqliteTable,text } from 'drizzle-orm/sqlite-core';
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
export const studyCredits=sqliteTable('study_credits',{
 id:text('id').primaryKey(),
 pointUnits:integer('point_units').notNull(),
 note:text('note').notNull().default(''),
 earnedDay:text('earned_day').notNull(),
 createdAt:text('created_at').notNull(),
},table=>[index('study_credits_day_idx').on(table.earnedDay)]);
export const leetcodeDailyCompletions=sqliteTable('leetcode_daily_completions',{
 questionId:text('question_id').notNull(),
 completedDay:text('completed_day').notNull(),
 name:text('name').notNull(),
 difficulty:text('difficulty').notNull(),
 pointUnits:integer('point_units').notNull(),
 importedAt:text('imported_at').notNull(),
},table=>[primaryKey({columns:[table.questionId,table.completedDay]}),index('leetcode_completions_day_idx').on(table.completedDay)]);
export const leetcodeHistoryImport=sqliteTable('leetcode_history_import',{
 id:text('id').primaryKey(),
 firstDay:text('first_day').notNull(),
 lastDay:text('last_day').notNull(),
 reviewedProblems:integer('reviewed_problems').notNull(),
 expectedProblems:integer('expected_problems').notNull(),
 complete:integer('complete').notNull().default(0),
 importedAt:text('imported_at').notNull(),
 sourceUrl:text('source_url').notNull(),
});
