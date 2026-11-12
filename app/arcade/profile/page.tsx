'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ArcadeBackground from '@/components/ArcadeBackground';
import { arcadeManager } from '@/lib/arcade/ArcadeManager';
import { PlayerProfile, Achievement, GameStats, MEDAL_THRESHOLDS, MedalType } from '@/lib/arcade/types';
import { LeaderboardEntry } from '@/lib/arcade/ScoreManager';
import { Trophy, Clock, Gamepad2, Star, Medal, Crown } from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    // Load data
    setProfile(arcadeManager.profile.getProfile());
    setAchievements(arcadeManager.achievements.getAll());
    setLeaderboard(arcadeManager.scores.getTopScores(10));
  }, []);

  if (!profile) return null;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const getLevel = (score: number) => {
    return Math.floor(Math.sqrt(score / 100)) + 1;
  };

  const getMedalsForScore = (gameId: string, score: number) => {
    const thresholds = MEDAL_THRESHOLDS[gameId];
    if (!thresholds) return [];
    const medals: MedalType[] = [];
    if (score >= thresholds.gold) medals.push('gold');
    if (score >= thresholds.silver) medals.push('silver');
    if (score >= thresholds.bronze) medals.push('bronze');
    return medals;
  };

  return (
    <div className="min-h-screen flex flex-col relative text-white">
      <ArcadeBackground />
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />
      <Navbar />

      <main className="flex-grow container mx-auto px-6 py-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-display font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
            {profile.name.toUpperCase()}
          </h1>
          <p className="text-gray-400">Track your arcade progress and achievements.</p>
        </motion.div>

        {/* Player Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <StatCard
            icon={<Trophy className="w-8 h-8 text-pink-400" />}
            label="Arcade Level"
            value={getLevel(profile.totalScore).toString()}
          />
          <StatCard
            icon={<Gamepad2 className="w-8 h-8 text-cyan-400" />}
            label="Games Played"
            value={profile.gamesPlayed.toString()}
          />
          <StatCard
            icon={<Star className="w-8 h-8 text-yellow-400" />}
            label="Total Score"
            value={profile.totalScore.toLocaleString()}
          />
          <StatCard
            icon={<Clock className="w-8 h-8 text-purple-400" />}
            label="Play Time"
            value={formatTime(profile.playTime)}
          />
          <StatCard
            icon={<Medal className="w-8 h-8 text-orange-400" />}
            label="Favorite Game"
            value={profile.favoriteGame ? profile.favoriteGame.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '-'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Achievements & Game Stats */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Achievements */}
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Trophy className="text-yellow-500" />
                Achievements
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-4 rounded-xl border ${
                      achievement.unlocked
                        ? 'bg-white/10 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                        : 'bg-black/40 border-white/5 opacity-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`font-bold ${achievement.unlocked ? 'text-yellow-400' : 'text-gray-500'}`}>
                        {achievement.title}
                      </h3>
                      {achievement.unlocked && <span className="text-xs text-green-400">✓</span>}
                    </div>
                    <p className="text-sm text-gray-400">{achievement.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Game Stats & Medals */}
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Medal className="text-cyan-500" />
                Game Statistics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(profile.highScores).map(([gameId, score]) => {
                  const medals = getMedalsForScore(gameId, score);
                  return (
                    <div key={gameId} className="bg-white/5 border border-white/10 rounded-xl p-6 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Gamepad2 size={64} />
                      </div>
                      
                      <h3 className="text-xl font-bold mb-4 capitalize text-white">{gameId.replace('-', ' ')}</h3>
                      
                      <div className="flex justify-between items-end mb-4">
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">High Score</p>
                          <p className="text-2xl font-mono text-cyan-400 font-bold">{score.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                        {['bronze', 'silver', 'gold'].map((medal) => (
                          <div 
                            key={medal}
                            className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                              medals.includes(medal as MedalType)
                                ? medal === 'gold' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]'
                                : medal === 'silver' ? 'bg-gray-300/20 border-gray-300 text-gray-300 shadow-[0_0_10px_rgba(209,213,219,0.3)]'
                                : 'bg-orange-700/20 border-orange-700 text-orange-700 shadow-[0_0_10px_rgba(194,65,12,0.3)]'
                                : 'bg-black/50 border-white/5 text-white/10'
                            }`}
                            title={`${medal.charAt(0).toUpperCase() + medal.slice(1)} Medal`}
                          >
                            <Medal size={16} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {Object.keys(profile.highScores).length === 0 && (
                  <p className="text-gray-500 italic col-span-full">No games played yet. Go to the Arcade to start earning medals!</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Leaderboard */}
          <div className="lg:col-span-1">
            <div className="bg-black/40 border border-white/10 rounded-2xl p-6 sticky top-24 backdrop-blur-md">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-purple-400">
                <Crown className="text-purple-500" />
                Global Leaderboard
              </h2>
              
              <div className="space-y-4">
                {leaderboard.length > 0 ? (
                  leaderboard.map((entry, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`
                          w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold
                          ${index === 0 ? 'bg-yellow-500 text-black' : 
                            index === 1 ? 'bg-gray-300 text-black' : 
                            index === 2 ? 'bg-orange-700 text-white' : 'bg-white/10 text-gray-400'}
                        `}>
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-bold text-sm text-white">{entry.playerName}</p>
                          <p className="text-xs text-gray-500 capitalize">{entry.gameName.replace('-', ' ')}</p>
                        </div>
                      </div>
                      <span className="font-mono text-cyan-400 font-bold">{entry.score.toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No scores recorded yet.</p>
                    <p className="text-xs mt-2">Be the first to claim the throne!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center gap-4"
    >
      <div className="p-3 bg-white/5 rounded-xl">{icon}</div>
      <div>
        <p className="text-gray-400 text-sm">{label}</p>
        <p className="text-2xl font-bold font-mono">{value}</p>
      </div>
    </motion.div>
  );
}
