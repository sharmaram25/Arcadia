import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Achievement } from '@/lib/arcade/types';

export default function AchievementToast() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    const handleUnlock = (e: CustomEvent<Achievement>) => {
      setAchievements(prev => [...prev, e.detail]);
      setTimeout(() => {
        setAchievements(prev => prev.filter(a => a.id !== e.detail.id));
      }, 5000);
    };

    window.addEventListener('achievement-unlocked', handleUnlock as EventListener);
    return () => window.removeEventListener('achievement-unlocked', handleUnlock as EventListener);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {achievements.map((achievement) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            className="bg-black/90 border border-yellow-400 p-4 rounded-lg shadow-[0_0_15px_rgba(250,204,21,0.5)] flex items-center gap-4 min-w-[300px]"
          >
            <div className="text-4xl">🏆</div>
            <div>
              <h4 className="text-yellow-400 font-bold text-sm uppercase tracking-wider">Achievement Unlocked</h4>
              <p className="text-white font-bold">{achievement.title}</p>
              <p className="text-gray-400 text-xs">{achievement.description}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
