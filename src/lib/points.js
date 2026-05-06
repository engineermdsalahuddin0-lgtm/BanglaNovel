// src/lib/points.js 
import { supabase } from './supabase'

export async function awardPoints(userId, points, reason, referenceId = null) {
  const today = new Date().toISOString().split('T')[0]

  // Points log এ add 
  await supabase.from('points_log').insert({
    user_id: userId,
    points,
    reason,
    reference_id: referenceId,
  })

  // Profile এ total points update করো
  const { data: profile } = await supabase
    .from('profiles').select('total_points, current_streak, longest_streak, last_active_date').eq('id', userId).single()

  // Streak calculate করো
  const lastActive = profile?.last_active_date
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  let newStreak = profile?.current_streak || 0
  if (lastActive === yesterdayStr) {
    newStreak += 1
  } else if (lastActive !== today) {
    newStreak = 1
  }

  const longestStreak = Math.max(newStreak, profile?.longest_streak || 0)

  // Streak bonus
  let streakBonus = 0
  if (newStreak === 7) streakBonus = 100
  else if (newStreak === 30) streakBonus = 500

  await supabase.from('profiles').update({
    total_points: (profile?.total_points || 0) + points + streakBonus,
    current_streak: newStreak,
    longest_streak: longestStreak,
    last_active_date: today,
  }).eq('id', userId)

  // Writing activity update করো
  const wordCount = referenceId ? 0 : 0 // caller থেকে দেওয়া হবে
  await supabase.from('writing_activity').upsert({
    user_id: userId,
    activity_date: today,
    chapters_published: reason.includes('Chapter') ? 1 : 0,
    points_earned: points + streakBonus,
  }, {
    onConflict: 'user_id,activity_date',
    ignoreDuplicates: false,
  })

  return { points, streakBonus, newStreak }
}

export async function awardChapterPoints(userId, chapterId, wordCount) {
  const today = new Date().toISOString().split('T')[0]

  let points = 50 // base: chapter publish
  const wordBonus = Math.floor(wordCount / 1000) * 20 // per 1000 words
  points += wordBonus

  // Points log
  await supabase.from('points_log').insert({
    user_id: userId,
    points,
    reason: `Chapter প্রকাশ (+${wordBonus} word bonus)`,
    reference_id: chapterId,
  })

  // Profile update with streak
  const { data: profile } = await supabase
    .from('profiles').select('total_points, current_streak, longest_streak, last_active_date').eq('id', userId).single()

  const lastActive = profile?.last_active_date
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  let newStreak = profile?.current_streak || 0
  if (lastActive === yesterdayStr) newStreak += 1
  else if (lastActive !== today) newStreak = 1

  const longestStreak = Math.max(newStreak, profile?.longest_streak || 0)

  let streakBonus = 0
  if (newStreak === 7) streakBonus = 100
  if (newStreak === 30) streakBonus = 500
  if (newStreak % 100 === 0) streakBonus = 1000

  if (streakBonus > 0) {
    await supabase.from('points_log').insert({
      user_id: userId,
      points: streakBonus,
      reason: `🔥 ${newStreak} দিনের streak bonus!`,
    })
  }

  await supabase.from('profiles').update({
    total_points: (profile?.total_points || 0) + points + streakBonus,
    current_streak: newStreak,
    longest_streak: longestStreak,
    last_active_date: today,
  }).eq('id', userId)

  // Activity table update
  const { data: existing } = await supabase
    .from('writing_activity').select('*').eq('user_id', userId).eq('activity_date', today).single()

  if (existing) {
    await supabase.from('writing_activity').update({
      chapters_published: (existing.chapters_published || 0) + 1,
      words_written: (existing.words_written || 0) + wordCount,
      points_earned: (existing.points_earned || 0) + points + streakBonus,
    }).eq('id', existing.id)
  } else {
    await supabase.from('writing_activity').insert({
      user_id: userId,
      activity_date: today,
      chapters_published: 1,
      words_written: wordCount,
      points_earned: points + streakBonus,
    })
  }

  return { points, streakBonus, newStreak }
}
